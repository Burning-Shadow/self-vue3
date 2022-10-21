import { extend } from "../shared";

let activeEffect;                         // 当前活跃的 ReactiveEffect 实例（fn），用于 get 操作时收纳入依赖回调队列
let shouldTrack;                          // 配合 stop API 使用，避免 stop 之后再执行 get 操作时重新收集依赖

export class ReactiveEffect {
  active = true;                          // 是否为响应式
  deps = [];                              // dependencys
  onStop?: () => void                     // stop 回调

  private _fn: Function;
  public scheduler: Function | undefined; // 执行 set 操作时的回调

  constructor(fn, scheduler?) {
    this._fn = fn;
    this.scheduler = scheduler;
  }

  // 执行回调
  run() {
    // 区分是否为 stop 状态
    if (!this.active) {
      return this._fn();
    }

    shouldTrack = true;
    activeEffect = this;

    const res = this._fn();
    // reset
    shouldTrack = false;
    activeEffect = undefined;

    return res;
  }

  // 删除回调
  stop() {
    if (this.active) {
      cleanupEffect(this);
      if (this.onStop) {
        this.onStop();
      }
      this.active = false;
    }
  }
};

function cleanupEffect(effect: ReactiveEffect) {
  effect.deps.forEach((dep: Set<any>) => {
    dep.delete(effect);
  });
};

export function isTracking() {
  return shouldTrack && activeEffect !== undefined;
};

export function trackEffects(dep) {
  if (dep.has(activeEffect)) return;

  dep.add(activeEffect);
  activeEffect.deps.push(dep);
};

export function triggerEffects(dep) {
  for (const effect of dep) {
    if (effect.scheduler) effect.scheduler();
    else effect.run();
  }
};

const targetMap = new Map();
export function track(target, key: string) {
  if (!isTracking()) return;

  // target -> key -> dep

  let depsMap = targetMap.get(target);
  if (!depsMap) {
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }

  let dep = depsMap.get(key);
  if (!dep) {
    dep = new Set();
    depsMap.set(key, dep);
  }

  trackEffects(dep);
};

export function trigger(target, key: string) {
  let depsMap = targetMap.get(target);
  let dep = depsMap.get(key);

  triggerEffects(dep);
};

export function effect(fn: Function, options: any = {}) {
  const { scheduler } = options;
  const _effect = new ReactiveEffect(fn, scheduler);
  extend(_effect, options);

  _effect.run();

  const runner: any = _effect.run.bind(_effect);
  runner.effect = _effect;

  return runner;
};

export function stop(runner: any) {
  runner.effect.stop();
};
