import { render } from "./render";
import { createVNode } from "./vnode";

export function createApp(rootComponent) {
  return {
    mount(rootContainer) {
      /**
       * component to vnode
       * 所有逻辑操作均基于 vnode 进行处理
      */
      const vnode = createVNode(rootComponent);
      render(vnode, rootContainer);
    },
  };
};
