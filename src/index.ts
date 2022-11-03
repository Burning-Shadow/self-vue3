// self-vue3 出口
export * from './runtime-dom/index';

import { baseCompile } from './compiler-core/src/index';
import * as runtimeDom from './runtime-dom/index';
import { registerRuntimeCompiler } from './runtime-dom/index';

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


