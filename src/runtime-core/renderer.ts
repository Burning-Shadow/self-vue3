import { effect } from "../reactivity/effect";
import { SHAPE_FLAGS } from "../shared/shapeFlags";
import { createComponentInstance, setupComopnent } from "./component";
import { createAppAPI } from "./creaetApp";
import { FRAGMENT, TEXT } from "./vnode";

export function createRenderer(options) {
  const {
    createElement: hostCreateElement,
    patchProp: hostPatchProp,
    insert: hostInsert,
  } = options;

  function render(nVNode, container) {
    patch(null, nVNode, container, null);
  };

  function patch(oVNode, nVNode, container, parent) {
    // debugger;
    const { type, shapeFlag } = nVNode;

    switch (type) {
      case FRAGMENT:
        /**
         * Fragment: 只渲染 children
         *  起因为 ———— slot 渲染时【src/runtime-core/helpers/renderSlot.ts : renderSlots】会执行 createVNode('div', {}, slot(props))，包裹一层 div
         *  该场景下为减少嵌套我们需引入新 vnode.type ———— Fragment
        */
        processFragment(oVNode.children, nVNode.children, container, parent);
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
          processElement(oVNode, nVNode, container, parent);
        } else if (shapeFlag & SHAPE_FLAGS.STATEFUL_COMPONENT) {
          // isObject(type)
          processComponent(oVNode, nVNode, container, parent);
        }
        break;
    }
  };

  function processText(oVNode: any, nVNode: any, container: any) {
    const { children } = nVNode;
    const textNode = (nVNode.el = document.createTextNode(children));
    container.append(textNode);
  };

  function processFragment(oChildren: Array<any>, nChildren: Array<any>, container: any, parent: any) {
    // console.log(nChildren);
    mountChildren(nChildren, container, parent);
  };

  function processElement(oVNode: any, nVNode: any, container: any, parent: any) {
    if (!oVNode) {
      console.log('init');
      mountElement(nVNode, container, parent);
    } else {
      // component update
      patchElement(oVNode, nVNode, container);
    }
  };

  function patchElement(oVNode: any, nVNode: any, container: any) {
    console.log('patch element');
    console.log('oldVNode = ', oVNode);
    console.log('newVNode = ', nVNode);

    // TODO 处理 element 更新对比
  };

  function processComponent(oVNode: any, nVNode: any, container: any, parent: any) {
    mountComponent(nVNode, container, parent);
  };

  function mountComponent(vnode: any, container: any, parent: any) {
    const instance = createComponentInstance(vnode, parent);

    setupComopnent(instance);
    setupRenderEffect(instance, vnode, container);
  }

  function mountElement(vnode: any, container: any, parent: any) {
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
      mountChildren(children, el, parent);
    }

    // props【attribute】
    for (const key in props) {
      hostPatchProp(el, key, props[key]);
    }

    hostInsert(el, container);
  }

  function mountChildren(childVNodes: Array<any>, container: any, parent: any) {
    childVNodes.forEach(vnode => {
      patch(null, vnode, container, parent);
    });
  };

  function setupRenderEffect(instance: any, vnode: any, container: any) {
    /**
     * 利用 effect 收集，包裹 render 函数
    */
    effect(() => {
      if (!instance.isMounted) {
        // init
        const { proxy } = instance;
        // 虚拟节点树 && 绑定组件代理，保证 this 可以取到值
        const subTree = (instance.subTree = instance.render.call(proxy));

        // vnode<Element> -> patch
        // vnode -> Element -> mountElement

        patch(null, subTree, container, instance);

        vnode.el = subTree.el;
        instance.isMounted = true;
      } else {
        // update logic
        const { proxy } = instance;
        // 虚拟节点树 && 绑定组件代理，保证 this 可以取到值
        const subTree = instance.render.call(proxy);
        const prevSubTree = instance.subTree;

        instance.subTree = subTree;
        patch(prevSubTree, subTree, container, instance);
      }
    });
  }

  return { createApp: createAppAPI(render) };
};
