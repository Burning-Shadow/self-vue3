import { generator } from "../src/codegen";
import { baseParse } from "../src/parser";
import { transform } from "../src/transform";
import { transformElement } from "../src/transforms/transformElement";
import { transformExpression } from "../src/transforms/transformExpression";
import { transformText } from "../src/transforms/transformText";

/**
 * 快照测试【去掉 -u 为测试，增加 -u 为强制更新 snap】
 * 直接点击 run 亦可
 * node 'node_modules/jest/bin/jest.js' '/Users/franciss/code/self-vue3/src/compiler-core/__test__/codegen.spec.ts' -t 'codegen string'
*/

describe('codegen', () => {
  it('string', () => {
    const ast = baseParse('hi');

    transform(ast);
    const { code } = generator(ast);
    expect(code).toMatchSnapshot();
  });

  it('interpolation', () => {
    const ast = baseParse('{{message}}');

    transform(ast, {
      nodeTransforms: [transformExpression],
    });
    const { code } = generator(ast);
    expect(code).toMatchSnapshot();
  });

  it('element', () => {
    const ast: any = baseParse('<div>hi,{{message}}</div>');

    transform(ast, {
      nodeTransforms: [transformExpression, transformElement, transformText],
    });
    console.log('ast = ', ast, ast.codegenNode.children);
    const { code } = generator(ast);
    expect(code).toMatchSnapshot();
  });
});
