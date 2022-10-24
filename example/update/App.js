import { h, ref } from '../../lib/guide-self-vue3.esm.js';

export const App = {
  name: 'UpdateApp',
  setup() {
    const count = ref(0);
    const onClick = () => {
      count.value++;
    };

    const props = ref({
      foo: 'foo',
      bar: 'bar',
    });
    const onChangePropsDemo1 = () => {
      // 点击后 #root 的 foo 属性由 foo 变为 new-foo
      props.value.foo = 'new-foo';
    };
    const onChangePropsDemo2 = () => {
      // 点击后 #root 上的 foo 值被移除
      props.value.foo = undefined;
    };
    const onChangePropsDemo3 = () => {
      // 点击后 #root 上的 属性只剩 foo & root
      props.value = { foo: 'foo' };
    };

    return {
      count,
      props,
      onClick,
      onChangePropsDemo1,
      onChangePropsDemo2,
      onChangePropsDemo3,
    };
  },
  render() {
    return h('div', { id: 'root', ...this.props }, [
      h('div', {}, `count: ${this.count}`),
      h('button', { onClick: this.onClick }, 'click'),
      h('button', { onClick: this.onChangePropsDemo1 }, `changeProps - 值改变了 - 修改`),
      h('button', { onClick: this.onChangePropsDemo2 }, `changeProps - 值变为 undefined - 删除`),
      h('button', { onClick: this.onChangePropsDemo3 }, `changeProps - key 在新的里没有了 - 删除`),
    ]);
  },
};
