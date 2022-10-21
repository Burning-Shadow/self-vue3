export const extend  = Object.assign;

export const isObject = (val) => val && typeof val === 'object';

export const hasChanged = (newValue, value) => !Object.is(newValue, value);
