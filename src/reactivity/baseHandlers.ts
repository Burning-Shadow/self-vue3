import { isObject } from "../shared";
import { track, trigger } from "./effect";
import { reactive, ReactiveFlags, readonly } from "./reactive";

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);

function createGetter(isReadonly: boolean = false) {
  return function (target, key) {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly;
    } else if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly;
    }

    const res = Reflect.get(target, key);

    if (isObject(res)) return isReadonly ? readonly(res) : reactive(res);

    // dependency collect
    if (!isReadonly) {
      track(target, key);
    }
    return res;
  };
};

function createSetter() {
  return function (target, key, value) {
    const res = Reflect.set(target, key, value);

    // trigger dependency
    trigger(target, key);
    return res;
  };
};

export const mutableHandlers = {
  get,
  set,
};

export const readonlyHandlers = {
  get: readonlyGet,
  set(target, key, value) {
    console.warn(`${value} can not be set into ${Reflect.get(target, key)} because this attribute is readonly`);
    return true;
  },
};
