// self-vue3 出口
export * from '@guide-self-vue3/runtime-dom';

import { baseCompile } from '@guide-self-vue3/compiler-core';
import * as runtimeDom from '@guide-self-vue3/runtime-dom';
import { registerRuntimeCompiler } from '@guide-self-vue3/runtime-dom';

function compileToFunction(template) {
  const { code } = baseCompile(template);
  console.log('code = ', code);
  const render = new Function('Vue', code)(runtimeDom);

  return render;
};

registerRuntimeCompiler(compileToFunction);

/**
 * 最终编译完成后的结果格式如下
    function renderFunction(Vue) {
      const {
        toDisplayString: _toDisplayString,
        openBlock: _openBlock,
        creatElementBlock: _createElementBlock,
      } = Vue;

      return function render(_ctx, _cache, $props, $setup, $data, $options) {
        return (
          _openBlock(),
          _createElementBlock(
            'div',
            null,
            'hi, ' + _toDisplayString(_ctx.message),
            1
          )
        );
      };
    };
 * 
*/


