import { h } from "../../lib/guide-self-vue3.esm.js";

export const Foo = {
  name: 'Foo',
  setup(props) {
    console.log(props);
    props.count++;
    console.log(props);
  },
  render() {
    return h('div', {}, `foo: ${this.count}`);
  },
};
