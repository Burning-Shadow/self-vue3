import { h } from "../../dist/guide-self-vue3.esm.js";

export const Child = {
  name: 'ComponentUpdateChild',
  setup(props, {emit}) {
    return {};
  },
  render(proxy) {
    return h('div', {}, [h('div', {}, `child - props msg: ${this.$props.msg}`)]);
  },
};
