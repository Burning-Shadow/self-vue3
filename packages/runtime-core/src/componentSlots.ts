import { SHAPE_FLAGS } from "@guide-self-vue3/shared";

export function initSlots(instance, children) {
  const { vnode } = instance;
  if (vnode.shapeFlag & SHAPE_FLAGS.SLOT_CHILDREN) {
    normalizeObjectSlots(children, instance.slots);
  }
};

function normalizeObjectSlots(children: any, slots: any) {
  for (const key in children) {
    const value = children[key];
    // 直接修改引用
    slots[key] = (props) => normalizeSlotValue(value(props));
  }
};

function normalizeSlotValue(value) {
  return Array.isArray(value) ? value : [value];
};
