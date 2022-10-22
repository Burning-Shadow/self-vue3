import { isObject } from "../shared";
import { SHAPE_FLAGS } from "../shared/shapeFlags";
import { createComponentInstance, setupComopnent } from "./component";

export function render(vnode, container) {
  patch(vnode, container);
};

function patch(vnode, container) {
  // debugger;
  /**
   * 判断 vnode 为 element 亦或为 component
  */
  const { shapeFlag } = vnode;
  if (shapeFlag & SHAPE_FLAGS.ELEMENT) {
    // typeof type === 'string'
    processElement(vnode, container);
  } else if (shapeFlag & SHAPE_FLAGS.STATEFUL_COMPONENT) {
    // isObject(type)
    processComponent(vnode, container);
  }
};

function processElement(vnode: any, container: any) {
  mountElement(vnode, container);
};

function processComponent(vnode: any, container: any) {
  mountComponent(vnode, container);
};

function mountComponent(vnode: any, container: any) {
  const instance = createComponentInstance(vnode);

  setupComopnent(instance);
  setupRenderEffect(instance, vnode, container);
}

function mountElement(vnode: any, container: any) {
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
    mountChildren(children, el);
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

function mountChildren(vnodes: Array<any>, container: any) {
  vnodes.forEach(vnode => {
    patch(vnode, container);
  });
};

function setupRenderEffect(instance: any, vnode: any, container: any) {
  const { proxy } = instance;
  // 虚拟节点树 && 绑定组件代理，保证 this 可以取到值
  const subTree = instance.render.call(proxy);

  // vnode<Element> -> patch
  // vnode -> Element -> mountElement

  patch(subTree, container);

  vnode.el = subTree.el;
}

