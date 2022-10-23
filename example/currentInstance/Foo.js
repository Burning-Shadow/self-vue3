import { h, getCurrentInstance } from "../../lib/guide-self-vue3.esm.js";

export const Foo = {
  name: 'CurrentInstanceFoo',
  setup() {
    const instance = getCurrentInstance();
    console.log('CurrentInstanceFoo = ', instance);
    return {};
  },
  render() {
    return h('div', {}, `foo`);
  },
};
