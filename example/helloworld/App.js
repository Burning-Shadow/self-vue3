import { h } from '../../lib/guide-self-vue3.esm.js';

window.self = null;

export const App = {
  render() {
    window.self = this;
    return h(
      'div',
      {
        id: 'root',
        class: ['red', 'hard'],
        onClick() {
          console.log('click')
        },
        onMousedown() {
          console.log('mousedown')
        },
      },
      `hi ${this.msg}`
      // [h('p', { class: 'red' }, 'hi'), h('p', { class: 'blue' }, 'franciss')]
    );
  },

  setup() {
    return {
      msg: 'franciss'
    };
  }
};
