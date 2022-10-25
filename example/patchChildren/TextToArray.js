import { ref, h } from '../../lib/guide-self-vue3.esm.js';

const prevChildren = 'newChild';
const nextChildren = [h('div', {}, 'A'), h('div', {}, 'B')];

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