import { isObject } from "../shared";
import { createComponentInstance, setupComopnent } from "./component";

export function render(vnode, container) {
  patch(vnode, container);
};

function patch(vnode, container) {
  /**
   * 判断 vnode 为 element 亦或为 component
  */
  const { type } = vnode;
  if (typeof type === 'string') {
    processElement(vnode, container);
  } else if (isObject(type)) {
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
  const { type, props, children } = vnode;

  const el = (vnode.el = document.createElement(type));

  // vnode.children 分为两种类型 ———— string | Array
  if (typeof children === 'string') {
    el.textContent = children;
  } else if (Array.isArray(children)) {
    // vnode
    mountChildren(children, el);
  }

  // props【attribute】
  for (const key in props) {
    el.setAttribute(key, props[key]);
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

