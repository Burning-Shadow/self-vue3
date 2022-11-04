import { ReactiveEffect } from "@guide-self-vue3/reactivity";
import { queuePreFlushCb } from "./scheduler";

export function watchEffect(sourceFunc) {
  function job() {
    effect.run();
  };

  let cleanup;
  const onCleanup = function (fn) {
    cleanup = effect.onStop = () => fn();
  }

  function getter() {
    if (cleanup) cleanup();
    sourceFunc(onCleanup);
  };

  const effect = new ReactiveEffect(getter, () => {
    queuePreFlushCb(job);
  });

  // watchEffect 初始阶段即调用，故此处手动触发 run 操作
  effect.run();

  return () => {
    effect.stop();
  }
};
