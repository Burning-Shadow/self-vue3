import { camelize, toHandlerKay } from "../shared/index";

export function emit(instance: any, event: string, ...args) {
  // console.log(`emit = ${emit}`);
  const { props } = instance;

  const handlerName = toHandlerKay(camelize(event));
  const handler = props[handlerName];

  handler && handler(...args);
};
