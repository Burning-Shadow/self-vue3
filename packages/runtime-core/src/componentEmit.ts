import { camelize, toHandlerKay } from "@guide-self-vue3/shared";

export function emit(instance: any, event: string, ...args) {
  // console.log(`emit = ${emit}`);
  const { props } = instance;

  const handlerName = toHandlerKay(camelize(event));
  const handler = props[handlerName];

  handler && handler(...args);
};
