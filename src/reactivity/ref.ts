import { hasChanged, isObject } from "../shared";
import { trackEffects, triggerEffects, isTracking } from "./effect";
import { reactive } from "./reactive";

/**
 * 同样为响应式，reactive 针对的是对象，而 ref 则针对基础类型
 * 故我们需以 RefImpl 类进行包裹，并以 .value 的形式调用
*/
class RefImpl {
  private _value: any;
  private _rawValue: any;
  public dep: Set<any>;

  constructor(value) {
    this._rawValue = value;
    // 若为 obj 则处理为响应式对象
    this._value = convert(value);

    this.dep = new Set();
  };

  get value() {
    trackRefValue(this);
    return this._value;
  };

  set value(newValue) {
    if (!hasChanged(newValue, this._rawValue)) return;

    this._rawValue = newValue;
    this._value = convert(newValue);
    triggerEffects(this.dep);
  };
}

export function ref(value) {
  return new RefImpl(value);
};

function trackRefValue(ref: RefImpl) {
  if (isTracking()) {
    trackEffects(ref.dep);
  }
};

function convert(value) {
  return isObject(value) ? reactive(value) : value;
};

export function isRef(ref) {
  return ref instanceof RefImpl;
};

export function unRef(ref) {
  return isRef(ref) ? ref.value : ref;
};
