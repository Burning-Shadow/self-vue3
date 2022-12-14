import { ref, h } from '../../dist/guide-self-vue3.esm.js';

const prevChildren = 'oldChild';
const nextChildren = 'newChild';

export default {
  name: 'ArrayToText',
  setup() {
    const isChange = ref(false);
    window.isChange = isChange;

    return { isChange };
  },
  render() {
    const self = this;

    return self.isChange === true
      ? h('div', {}, nextChildren)
      : h('div', {}, prevChildren);
  },
}