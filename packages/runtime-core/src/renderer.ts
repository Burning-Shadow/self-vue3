import { effect } from "@guide-self-vue3/reactivity/src/effect";
import { getSequence, isEmptyObject, SHAPE_FLAGS } from "@guide-self-vue3/shared";
import { createComponentInstance, setupComopnent } from "./component";
import { createAppAPI } from "./creaetApp";
import { shouldComponentUpdate } from "./helpers/componentUpdateUtils";
import { queueJobs } from "./scheduler";
import { FRAGMENT, TEXT } from "./vnode";

export function createRenderer(options) {
  const {
    createElement: hostCreateElement,
    patchProp: hostPatchProp,
    insert: hostInsert,
    remove: hostRemove,
    setElementText: hostSetElementText,
  } = options;

  // first render
  function render(nVNode, container) {
    patch(null, nVNode, container, null, null);
  };

  function patch(oVNode, nVNode, container, parent, anchor: number | null) {
    // debugger;
    const { type, shapeFlag } = nVNode;

    switch (type) {
      case FRAGMENT:
        /**
         * Fragment: 只渲染 children
         *  起因为 ———— slot 渲染时【src/runtime-core/helpers/renderSlot.ts : renderSlots】会执行 createVNode('div', {}, slot(props))，包裹一层 div
         *  该场景下为减少嵌套我们需引入新 vnode.type ———— Fragment
        */
        processFragment(oVNode.children, nVNode.children, container, parent, anchor);
        break;

      case TEXT:
        processText(oVNode, nVNode, container);
        break;

      default:
        /**
         * 默认判断 vnode 为 element 亦或为 component
        */
        if (shapeFlag & SHAPE_FLAGS.ELEMENT) {
          // typeof type === 'string'
          processElement(oVNode, nVNode, container, parent, anchor);
        } else if (shapeFlag & SHAPE_FLAGS.STATEFUL_COMPONENT) {
          // isObject(type)
          processComponent(oVNode, nVNode, container, parent, anchor);
        }
        break;
    }
  };

  function processText(oVNode: any, nVNode: any, container: any) {
    const { children } = nVNode;
    const textNode = (nVNode.el = document.createTextNode(children));
    container.append(textNode);
  };

  function processFragment(oChildren: Array<any>, nChildren: Array<any>, container: any, parent: any, anchor: number | null) {
    // console.log(nChildren);
    mountChildren(nChildren, container, parent, anchor);
  };

  function processElement(
    oVNode: any,
    nVNode: any,
    container: any,
    parent: any,
    anchor: number | null,
  ) {
    if (!oVNode) {
      console.log('init');
      mountElement(nVNode, container, parent, anchor);
    } else {
      // component update
      patchElement(oVNode, nVNode, container, parent, anchor);
    }
  };

  function patchElement(oVNode: any, nVNode: any, container: any, parent: any, anchor: number | null) {
    console.log('patch element');
    console.log('oldVNode = ', oVNode);
    console.log('newVNode = ', nVNode);

    // TODO 处理 element 更新对比

    const oldProps = oVNode.props || {};
    const newProps = nVNode.props || {};

    /**
     * TODO 这里没搞明白为什么要将 oVNode.el 赋值给 nVNode.el
     * 因为下次调用时 nVNode 会变为 oVNode，故
    */
    const el = (nVNode.el = oVNode.el);

    patchChildren(oVNode, nVNode, el, parent, anchor);
    patchProps(el, oldProps, newProps);
  };

  function patchChildren(oVNode: any, nVNode: any, container: any, parent: any, anchor: number | null) {
    const { shapeFlag: prevShapeFlag, children: oChildren } = oVNode;
    const { shapeFlag: nextShapeFlag, children: nChildren } = nVNode;

    if (nextShapeFlag & SHAPE_FLAGS.TEXT_CHILDREN) {
      if (prevShapeFlag & SHAPE_FLAGS.ARRAY_CHILDREN) {
        /**
         * Array -> Text
        */
        // 1. 清空老数组
        unmountChildren(oVNode.children);

        // 2. 设置新 text
        hostSetElementText(container, nChildren);
      } else {
        /**
         * Text -> Text
        */
        if (oChildren !== nChildren) {
          hostSetElementText(container, nChildren);
        }
      }
    } else {
      if (prevShapeFlag & SHAPE_FLAGS.TEXT_CHILDREN) {
        /**
         * Array -> Text
        */
        hostSetElementText(container, '');
        mountChildren(nChildren, container, parent, anchor);
      } else {
        /**
         * Array -> Array 【the diff algorithm】
        */
        patchKeyChildren(oChildren, nChildren, container, parent, anchor);
      }
    }
  }

  function patchKeyChildren(
    c1: Array<any>,
    c2: Array<any>,
    container: any,
    parent: any,
    parentAnchor: number | null,
  ) {
    const l2 = c2.length;
    let i = 0,
      e1 = c1.length - 1,
      e2 = l2 - 1;

    function isVNodeEqual(node1: any, node2: any): boolean {
      return node1.type === node2.type && node1.key === node2.key;
    };

    /**
     * (a b) c
     * (a b) d e
    */
    while (i <= e1 && i <= e2) {
      const prevChild = c1[i];
      const nextChild = c2[i];

      if (!isVNodeEqual(prevChild, nextChild)) break;

      patch(prevChild, nextChild, container, parent, parentAnchor);
      i++;
    }

    /**
     *   a (b c)
     * d e (b c)
    */
    while (i <= e1 && i <= e2) {
      const prevChild = c1[e1];
      const nextChild = c2[e2];

      if (!isVNodeEqual(prevChild, nextChild)) break;

      patch(prevChild, nextChild, container, parent, parentAnchor);
      e1--;
      e2--;
    }

    /**
     * (a b)
     * (a b) c d
    */
    if (i > e1 && i <= e2) {
      const nextPosition = e2 + 1;
      const anchor = nextPosition < l2 ? c2[nextPosition].el : parentAnchor;
      while (i <= e2) {
        patch(null, c2[i], container, parent, anchor);
        i++;
      }
    } else if (i > e2 && i <= e1) {
      /**
       * (a b) c d
       * (a b)
      */
      while (i <= e1) {
        hostRemove(c1[i].el);
        i++;
      }
    } else {
      /**
       * 乱序部分
      */
      let s1 = i,
        s2 = i,
        patched = 0,
        needMove = false,
        maxNewIndexSoFar = 0;

      const toBePatched = e2 - s2 + 1;
      const keyToNewIndexMap = new Map();
      const newIndex2OldIndexMap = new Array(toBePatched).fill(0); // idx 映射表【e2 - (s2 + 1) 范围内的】

      for (let i = s2; i <= e2; i++) {
        const nextChild = c2[i];
        keyToNewIndexMap.set(nextChild.key, i);
      }

      /**
       * a b (c d) f g
       * a b (e c) f g
      */
      for (let i = s1; i <= e1; i++) {
        const prevChild = c1[i];

        if (patched >= toBePatched) {
          hostRemove(prevChild.el);
          continue;
        }

        let newIndex;
        if (prevChild.key !== null) {
          newIndex = keyToNewIndexMap.get(prevChild.key);
        } else {
          for (let j = s2; j <= e2; j++) {
            if (isVNodeEqual(prevChild, c2[j])) {
              newIndex = j;
              break;
            }
          }
        }

        if (newIndex === undefined) {
          hostRemove(prevChild.el);
        } else {
          if (newIndex >= maxNewIndexSoFar) {
            maxNewIndexSoFar = newIndex;
          } else {
            needMove = true;
          }

          // 初始化 newIndex2OldIndexMap
          newIndex2OldIndexMap[newIndex - s2] = (i + 1); // 由于 newIndex2OldIndexMap 数组中 0 有特殊意义，故赋值为 (i + 1) 避免问题
          // 递归对比
          patch(prevChild, c2[newIndex], container, parent, null);
          patched++;
        }
      }

      const increasingNewIndexSequence = needMove ? getSequence(newIndex2OldIndexMap) : [];
      let pointer = increasingNewIndexSequence.length - 1;

      for (let i = toBePatched - 1; i >= 0; i--) {
        const nextIndex = i + s2;
        const nextChild = c2[nextIndex];
        const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null;

        if (newIndex2OldIndexMap[i] === 0) {
          patch(null, nextChild, container, parent, anchor);
        } else if (needMove) {
          if (pointer < 0 || i !== increasingNewIndexSequence[pointer]) {
            // 移动位置
            console.log('移动位置');
            hostInsert(nextChild.el, container, anchor);
          } else {
            pointer--;
          }
        }
      }
    }
  };

  function unmountChildren(children: Array<any>) {
    for (const child of children) {
      const { el } = child;
      hostRemove(el);
    }
  };

  function patchProps(el: any, oldProps: any, newProps: any) {
    // 若前后 props 相等则直接 return
    if (oldProps === newProps) return;

    for (const key in newProps) {
      const prevProp = oldProps[key];
      const nextProp = newProps[key];

      if (prevProp !== nextProp) {
        // update
        hostPatchProp(el, key, prevProp, nextProp);
      }
    }

    // 若前者为 {} 亦无需比较
    if (isEmptyObject(oldProps)) return;

    for (const key in oldProps) {
      if (!(key in newProps)) {
        hostPatchProp(el, key, oldProps[key], null);
      }
    }
  }

  function processComponent(oVNode: any, nVNode: any, container: any, parent: any, anchor: number | null) {
    if (!oVNode) {
      mountComponent(nVNode, container, parent, anchor);
    } else {
      // debugger;
      updateComponent(oVNode, nVNode);
    }
  };

  function updateComponent(oVNode: any, nVNode: any) {
    const instance = (nVNode.component = oVNode.component);
    if (shouldComponentUpdate(oVNode, nVNode)) {
      instance.next = nVNode; // 下次要更新的 vnode，便于后续 setupRenderEffect 的 update 逻辑调用
      instance.update();
    } else {
      // 不需要更新也得更新 el
      nVNode.el = oVNode.el;
      nVNode.vnode = nVNode;
    }
  }

  /**
   * init
  */
  function mountComponent(vnode: any, container: any, parent: any, anchor: number | null) {
    const instance = (vnode.component = createComponentInstance(vnode, parent));

    setupComopnent(instance);
    setupRenderEffect(instance, vnode, container, anchor);
  }

  function mountElement(vnode: any, container: any, parent: any, anchor: number | null) {
    const { type, props, children, shapeFlag } = vnode;

    const el = (vnode.el = hostCreateElement(type));

    /**
     * 判断 vnode.children 为 string 亦或为 Array
     * 
     * 之所以采取位运算的形式是因为可以保证双类型：
     *  eg: 0101【对应数值为5】即代表该 vnode 既是 ELEMENT类型 又是 TEXT_CHILDREN类型
    */
    if (shapeFlag & SHAPE_FLAGS.TEXT_CHILDREN) {
      // typeof children === 'string'
      el.textContent = children;
    } else if (shapeFlag & SHAPE_FLAGS.ARRAY_CHILDREN) {
      // Array.isArray(children)
      // vnode
      mountChildren(children, el, parent, anchor);
    }

    // props【attribute】
    for (const key in props) {
      hostPatchProp(el, key, null, props[key]);
    }

    hostInsert(el, container, anchor);
  }

  function mountChildren(childVNodes: Array<any>, container: any, parent: any, anchor: number | null) {
    childVNodes.forEach(vnode => {
      patch(null, vnode, container, parent, anchor);
    });
  };

  function setupRenderEffect(instance: any, vnode: any, container: any, anchor: number | null) {
    /**
     * 利用 effect 收集，包裹 render 函数
    */
    instance.update = effect(() => {
      if (!instance.isMounted) {
        // init
        const { proxy } = instance;
        // 虚拟节点树 && 绑定组件代理，保证 this 可以取到值
        const subTree = (instance.subTree = instance.render.call(proxy, proxy));

        // vnode<Element> -> patch
        // vnode -> Element -> mountElement

        patch(null, subTree, container, instance, anchor);

        vnode.el = subTree.el;
        instance.isMounted = true;
      } else {
        // debugger;
        // update logic

        const { next: nVNode, vnode: oVNode } = instance;

        if (nVNode) {
          nVNode.el = oVNode.el;
          updateComponentPreRender(instance, nVNode);
        }

        const { proxy } = instance;
        // 虚拟节点树 && 绑定组件代理，保证 this 可以取到值
        const subTree = instance.render.call(proxy, proxy);
        const prevSubTree = instance.subTree;

        instance.subTree = subTree;
        patch(prevSubTree, subTree, container, instance, anchor);
      }
    }, {
      scheduler() {
        console.log('update scheduler');
        queueJobs(instance.update);
      }
    });
  }

  return { createApp: createAppAPI(render) };
};

function updateComponentPreRender(instance, nVNode) {
  // debugger;
  // 迭代更新
  instance.vnode = nVNode;
  instance.next = null;

  instance.props = nVNode.props;
};
