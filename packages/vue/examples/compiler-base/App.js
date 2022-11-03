import { ref } from '../../dist/guide-self-vue3.esm.js';

export const App = {
  name: 'App',
  /**
   * template 目前字符串的换行空格等暂未处理（trim），故 demo 暂时无法随意删减空格
  */
  // template: `<div>hi,{{msg}}</div>`,
  template: `<div>hi,{{count}}</div>`,
  setup() {
    const count = window.count = ref(1);
    return {
      count,
      msg: 'franciss',
    };
  }
};


// (function anonymous(Vue) {
//   const { toDisplayString: _toDisplayString, createElementVNode: _createElementVNode } = Vue

//   return function render(_ctx, _cache) {
//     return createElementVNode('div', null, 'hi,' + _toDisplayString(_ctx.count))
//   }
// })