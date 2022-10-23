import { createTextVNode, h } from '../../lib/guide-self-vue3.esm.js';
import { Foo } from './Foo.js';

window.self = null;

/**
 * 有兴趣可以在【Vue3 Template Explorer】试运行一下以下代码，查看编译后的 render 函数
 * https://vue-next-template-explorer.netlify.app/
 * 
  <div id="app">
    <slot></slot>
    <slot name="header" age="18"></slot>

    <Foo>
      <p>123</p>
      <p>456</p>
      <template v-slot:header>haihaihai</template>
    </Foo>
  </div>
*/

export const App = {
  name: 'ComponentSlotApp',
  render() {
    const app = h('div', {}, 'App');
    const foo = h(Foo, {}, {
      header: ({ age }) => [
        h('p', {}, `header: age = ${age}`),
        createTextVNode('你好啊'),
      ],
      footer: () => h('p', {}, 'footer'),
    });

    return h('div', {}, [app, foo]);
  },

  setup() {
    return {
    };
  }
};
