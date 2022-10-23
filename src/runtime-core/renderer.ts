import { isObject } from "../shared/index";
import { SHAPE_FLAGS } from "../shared/shapeFlags";
import { createComponentInstance, setupComopnent } from "./component";
import { FRAGMENT, TEXT } from "./vnode";

export function render(vnode, container) {
  patch(vnode, container, null);
};

function patch(vnode, container, parent) {
  // debugger;
  const { type, shapeFlag } = vnode;

  switch (type) {
    case FRAGMENT:
      /**
       * Fragment: 只渲染 children
       *  起因为 ———— slot 渲染时【src/runtime-core/helpers/renderSlot.ts : renderSlots】会执行 createVNode('div', {}, slot(props))，包裹一层 div
       *  该场景下为减少嵌套我们需引入新 vnode.type ———— Fragment
      */
      processFragment(vnode.children, container, parent);
      break;

    case TEXT:
      processText(vnode, container);
      break;

    default:
      /**
       * 默认判断 vnode 为 element 亦或为 component
      */
      if (shapeFlag & SHAPE_FLAGS.ELEMENT) {
        // typeof type === 'string'
        processElement(vnode, container, parent);
      } else if (shapeFlag & SHAPE_FLAGS.STATEFUL_COMPONENT) {
        // isObject(type)
        processComponent(vnode, container, parent);
      }
      break;
  }
};

function processText(vnode: any, container: any) {
  const { children } = vnode;
  const textNode = (vnode.el = document.createTextNode(children));
  container.append(textNode);
};

function processFragment(children: Array<any>, container: any, parent: any) {
  // console.log(children);
  mountChildren(children, container, parent);
};

function processElement(vnode: any, container: any, parent: any) {
  mountElement(vnode, container, parent);
};

function processComponent(vnode: any, container: any, parent: any) {
  mountComponent(vnode, container, parent);
};

function mountComponent(vnode: any, container: any, parent: any) {
  const instance = createComponentInstance(vnode, parent);

  setupComopnent(instance);
  setupRenderEffect(instance, vnode, container);
}

function mountElement(vnode: any, container: any, parent: any) {
  const { type, props, children, shapeFlag } = vnode;

  const el = (vnode.el = document.createElement(type));

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

  const isNativeEvent = (key: string) => /^on[A-Z]/.test(key);

  // props【attribute】
  for (const key in props) {
    if (isNativeEvent(key)) {
      const event = key.slice(2).toLocaleLowerCase();
      // 此处的 props[key] 为 callback，为防止混淆故未在上方进行 props[key] 对提前解析
      el.addEventListener(event, props[key]);
    } else {
      el.setAttribute(key, props[key]);
    }
  }

  container.append(el);
}

function mountChildren(childVNodes: Array<any>, container: any, parent: any) {
  childVNodes.forEach(vnode => {
    patch(vnode, container, parent);
  });
};

function setupRenderEffect(instance: any, vnode: any, container: any) {
  const { proxy } = instance;
  // 虚拟节点树 && 绑定组件代理，保证 this 可以取到值
  const subTree = instance.render.call(proxy);

  // vnode<Element> -> patch
  // vnode -> Element -> mountElement

  patch(subTree, container, instance);

  vnode.el = subTree.el;
}

