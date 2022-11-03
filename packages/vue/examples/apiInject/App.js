import { h, provide, inject } from '../../dist/guide-self-vue3.esm.js';

const Provider = {
  name: 'Provider',
  setup() {
    provide('foo', 'fooValue');
    provide('bar', 'barValue');
    return {};
  },
  render() {
    return h('div', {}, [h('p', {}, 'Provider'), h(ProviderMiddle)]);
  },
};

const ProviderMiddle = {
  name: 'ProviderMiddle',
  setup() {
    provide('foo', 'fooTwo');
    const foo = inject('foo');

    return { foo };
  },
  render() {
    return h('div', {}, [h('p', {}, `ProviderMiddle: - ${this.foo}`), h(Consumer)]);
  },
};

export const Consumer = {
  name: 'Consumer',
  setup() {
    const foo = inject('foo');
    const bar = inject('bar');
    const baz = inject('baz', 'bazDefaultValue');
    const haihaihai = inject('haihaihai', () => 'haihaihai');

    return { foo, bar, baz, haihaihai };
  },
  render() {
    return h('div', {}, `Consumer: - ${this.foo} - ${this.bar} - ${this.baz} - ${this.haihaihai}`);
  },
};

export const App = {
  name: 'APIInject',
  setup() { },
  render() {
    return h('div', {}, [h('p', {}, 'apiInject'), h(Provider)]);
  },
}
