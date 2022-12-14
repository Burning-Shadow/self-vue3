import { createRenderer } from '@guide-self-vue3/runtime-core';

export function createElement(type) {
  console.log('createElement -------------');
  return document.createElement(type);
};

export function patchProp(
  el: any, key: string,
  prevValue: Function | string,
  nextValue: Function | string,
) {
  // console.log('patchProp -------------');
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

export function insert(el, parent, anchor: number | null) {
  // console.log('insert -------------');
  parent.insertBefore(el, anchor);
};

export function remove(el: any) {
  const parent = el.parentNode;
  if (parent) {
    parent.removeChild(el);
  }
}

export function setElementText(el: any, text: string) {
  el.textContent = text;
};

const renderer: any = createRenderer({
  createElement,
  patchProp,
  insert,
  remove,
  setElementText
});

export function createApp(...args) {
  return renderer.createApp(...args);
};

export * from '@guide-self-vue3/runtime-core';
