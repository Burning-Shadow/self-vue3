import { SHAPE_FLAGS } from "../shared/shapeFlags";

export function createVNode(type, props?, children?) {
  const vnode = {
    type,
    props,
    children,
    shapeFlag: getShapeFlag(type),
    el: null,
  }

  // children
  if (typeof children === 'string') {
    vnode.shapeFlag |= SHAPE_FLAGS.TEXT_CHILDREN
  } else if (Array.isArray(children)) {
    vnode.shapeFlag |= SHAPE_FLAGS.ARRAY_CHILDREN;
  }

  /**
   * 判断是否为 slot children:
  */
  if (vnode.shapeFlag & SHAPE_FLAGS.STATEFUL_COMPONENT) {
    if (typeof children === 'object') {
      vnode.shapeFlag |= SHAPE_FLAGS.SLOT_CHILDREN;
    }
  }

  return vnode;
};

function getShapeFlag(type: any) {
  return typeof type === 'string' ? SHAPE_FLAGS.ELEMENT : SHAPE_FLAGS.STATEFUL_COMPONENT;
}

