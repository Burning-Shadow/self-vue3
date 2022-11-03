import { createVNode, FRAGMENT } from "../vnode";

export function renderSlots(slots, name, props) {
  const slot = slots[name];
  // debugger;

  if (slot) {
    if (typeof slot === 'function') {
      return createVNode(FRAGMENT, {}, slot(props));
    }
  }
};
