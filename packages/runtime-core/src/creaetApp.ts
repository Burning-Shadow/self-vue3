import { createVNode } from "./vnode";

export function createAppAPI(render: Function) {
  return function createApp(rootComponent) {
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
};
