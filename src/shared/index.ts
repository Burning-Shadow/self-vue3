export const extend = Object.assign;

export const isObject = (val) => val && typeof val === 'object';

export const hasChanged = (newValue, value) => !Object.is(newValue, value);

export const hasOwn = (value: Object, key: string) => Object.prototype.hasOwnProperty.call(value, key);

export const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

export const toHandlerKay = (str: string) => str ? `on${capitalize(str)}` : '';

export const camelize = (str: string) => str.replace(/-(\w)/g, (_, c) => (c ? c.toUpperCase() : ''));
