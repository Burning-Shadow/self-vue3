import { createComponentInstance, setupComopnent } from "./component";

export function render(vnode, container) {
  patch(vnode, container);
};

function patch(vnode, container) {
  mountComponent(vnode, container);
};

function mountComponent(vnode: any, container: any) {
  const instance = createComponentInstance(vnode);

  setupComopnent(instance);
  setupRenderEffect(instance, container);
}

function setupRenderEffect(instance: any, container: any) {
  // 虚拟节点树
  const subTree = instance.render();

  // vnode<Element> -> patch
  // vnode -> Element -> mountElement

  patch(subTree, container);
}
