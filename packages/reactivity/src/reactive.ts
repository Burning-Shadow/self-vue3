import { isObject } from "@guide-self-vue3/shared";
import { mutableHandlers, readonlyHandlers, shallowReadonlyHandlers } from "./baseHandlers";

export const enum ReactiveFlags {
  IS_REACTIVE = "__v_isReactive",
  IS_READONLY = '__v_isReadonly',
};

function createReactiveObject(target: any, baseHandlers) {
  if (!isObject(target)) {
    console.error(`target ${target} must be an Object`);
    return;
  }

  return new Proxy(target, baseHandlers);
};

export function reactive(raw) {
  return createReactiveObject(raw, mutableHandlers);
};

export function readonly(raw) {
  return createReactiveObject(raw, readonlyHandlers);
};

export function shallowReadonly(raw) {
  return createReactiveObject(raw, shallowReadonlyHandlers);
};

export function isReactive(value) {
  return !!value[ReactiveFlags.IS_REACTIVE];
};

export function isReadonly(value) {
  return !!value[ReactiveFlags.IS_READONLY];
}

export function isProxy(value) {
  return isReactive(value) || isReadonly(value);
};
