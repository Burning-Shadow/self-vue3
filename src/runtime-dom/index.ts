import { createRenderer } from '../runtime-core/index';

export function createElement(type) {
  console.log('createElement -------------');
  return document.createElement(type);
};

export function patchProp(
  el: any, key: string,
  prevValue: Function | string,
  nextValue: Function | string,
) {
  console.log('patchProp -------------');
  const isNativeEvent = (key: string) => /^on[A-Z]/.test(key);

  if (isNativeEvent(key)) {
    const event = key.slice(2).toLocaleLowerCase();
    // 此处的 props[key]（nextValue） 为 callback，为防止混淆故未在上方进行 props[key] 对提前解析
    el.addEventListener(event, nextValue);
  } else {
    if (nextValue === undefined || nextValue === null) {
      // 值被删除时移除对应 props 属性
      el.removeAttribute(key);
    } else {
      el.setAttribute(key, nextValue);
    }
  }
};

export function insert(el, parent) {
  console.log('insert -------------');
  parent.append(el);
};

const renderer: any = createRenderer({
  createElement,
  patchProp,
  insert,
});

export function createApp(...args) {
  return renderer.createApp(...args);
};

export * from '../runtime-core/index';
