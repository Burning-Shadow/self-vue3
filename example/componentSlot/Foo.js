import { h, renderSlots } from "../../lib/guide-self-vue3.esm.js";

export const Foo = {
  name: 'ComponentSlotFoo',
  setup() {
    return {
      age: 1
    };
  },
  render() {
    const foo = h('p', {}, 'foo');
    const { age } = this;
    console.log(this.$slots);

    return h('div', {}, [
      renderSlots(this.$slots, 'header', { age }), // 具名插槽
      foo,                                // 匿名插槽
      renderSlots(this.$slots, 'footer'), // 具名插槽
    ]);
  },
};
