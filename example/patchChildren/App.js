import { h } from '../../lib/guide-self-vue3.esm.js';

import ArrayToText from './ArrayToText.js';
import TextToText from './TextToText.js';
import TextToArray from './TextToArray.js';
import ArrayToArray from './ArrayToArray.js';

export const App = {
  name: 'PatchChildrenApp',
  setup() {
    return {};
  },
  render() {
    // 控制台收入 isChange.value = true;
    return h('div', { tId: 1 }, [
      h('div', {}, '主页'),
      // h(ArrayToText),
      // h(TextToText),
      // h(TextToArray),
      h(ArrayToArray),
    ]);
  },
};
