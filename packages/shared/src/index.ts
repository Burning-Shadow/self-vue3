export * from './toDisplayString';

export * from './shapeFlags';

export const extend = Object.assign;

export const isObject = (val) => val && typeof val === 'object';

export const isString = (val) => typeof val === 'string';

export const hasChanged = (newValue, value) => !Object.is(newValue, value);

export const hasOwn = (value: Object, key: string) => Object.prototype.hasOwnProperty.call(value, key);

export const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

export const toHandlerKay = (str: string) => str ? `on${capitalize(str)}` : '';

export const camelize = (str: string) => str.replace(/-(\w)/g, (_, c) => (c ? c.toUpperCase() : ''));

export const isEmptyObject = (obj) => Object.keys(obj).length === 0;

export function getSequence(arr: Array<number>): Array<number> {
  const p = arr.slice();
  const result = [0];
  let i, j, u, v, c;
  const len = arr.length;
  for (i = 0; i < len; i++) {
    const arrI = arr[i];
    if (arrI !== 0) {
      j = result[result.length - 1];
      if (arr[j] < arrI) {
        p[i] = j;
        result.push(i);
        continue;
      }
      u = 0;
      v = result.length - 1;
      while (u < v) {
        c = (u + v) >> 1;
        if (arr[result[c]] < arrI) {
          u = c + 1;
        } else {
          v = c;
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1];
        }
        result[u] = i;
      }
    }
  }
  u = result.length;
  v = result[u - 1];
  while (u-- > 0) {
    result[u] = v;
    v = p[v];
  }
  return result;
};
