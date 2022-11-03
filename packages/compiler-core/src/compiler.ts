import { generator } from './codegen';
import { baseParse } from './parser';
import { transform } from './transform';
import { transformElement } from './transforms/transformElement';
import { transformExpression } from './transforms/transformExpression';
import { transformText } from './transforms/transformText';

export function baseCompile(template: string) {
  const ast: any = baseParse(template);
  console.log(ast);

  transform(ast, {
    nodeTransforms: [transformExpression, transformElement, transformText],
  });
  console.log('compiler ast = ', ast, ast.codegenNode.children);
  return generator(ast);
};
