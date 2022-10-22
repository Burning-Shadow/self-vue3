import { h } from '../../lib/guide-self-vue3.esm.js';

export const App = {
  render() {
    return h(
      'div',
      {
        id: 'root',
        class: ['red', 'hard'],
      },
      // `hi ${this.msg}`
      [h('p', { class: 'red' }, 'hi'), h('p', { class: 'blue' }, 'franciss')]
    );
  },

  setup() {
    return {
      msg: 'self-vue3'
    };
  }
};
