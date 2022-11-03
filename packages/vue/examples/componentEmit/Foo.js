import { h } from "../../dist/guide-self-vue3.esm.js";

export const Foo = {
  name: 'ComponentEmitFoo',
  setup(props, { emit }) {
    const emitAdd = () => {
      console.log('emit add');
      emit('add', 1, 2);
      console.log('emit add-foo');
      emit('add-foo', 1, 2);
    };

    return { emitAdd };
  },
  render() {
    const btn = h('button', {
      onClick: this.emitAdd
    }, 'emitAdd');
    const foo = h('p', {}, 'foo');

    return h('div', {}, [foo, btn]);
  },
};
