import { h, getCurrentInstance } from '../../lib/guide-self-vue3.esm.js';
import { Foo } from './Foo.js';

export const App = {
  name: 'CurrentInstanceApp',
  render() {
    window.self = this;
    return h('div', {}, [
      h('div', {}, [h('p', {}, 'currentInstance demo'), h(Foo)]),
    ]);
  },

  setup() {
    const instance = getCurrentInstance();
    console.log('CurrentInstanceApp = ', instance);
  }
};
