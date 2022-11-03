import { h, ref, getCurrentInstance, nextTick } from '../../dist/guide-self-vue3.esm.js';

export const App = {
  name: 'NextTicker',
  setup() {
    const instance = getCurrentInstance();

    const count = ref(1);

    function onClick() {
      for (let i = 0; i < 100; i++) {
        console.log('update');
        count.value = i;
      }

      console.log('instance = ', instance); // instance.vnode.el.innerText 中的节点 count 值仍为 1
      nextTick(() => {
        console.log('nextTick instance = ', instance);  // instance.vnode.el.innerText 中的节点 count 值仍为 99
      });
    };

    return { onClick, count };
  },
  render() {
    const button = h('button', { onClick: this.onClick }, 'update');
    const p = h('p', {}, `count: ${this.count}`);

    return h('div', {}, [button, p]);
  },
}
