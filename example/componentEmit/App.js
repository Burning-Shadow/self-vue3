import { h } from '../../lib/guide-self-vue3.esm.js';
import { Foo } from './Foo.js';

window.self = null;

export const App = {
  name: 'ComponentEmitApp',
  render() {
    window.self = this;
    return h('div', {}, [
      h('div', {}, 'App'),
      h(Foo, {
        onAdd(a, b) {
          console.log('onAdd', a, b);
        },
        onAddFoo(a, b) {
          console.log('onAddFoo', a, b);
        },
      })],
    );
  },

  setup() {
    return {
    };
  }
};
