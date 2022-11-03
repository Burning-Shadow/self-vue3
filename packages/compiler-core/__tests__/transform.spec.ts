import { NodeTypes } from "../src/ast";
import { baseParse } from "../src/parser";
import { transform } from "../src/transform";

describe('transform', () => {
  it('happy path', () => {
    const ast = baseParse('<div>hi, {{ msg }}</div>');
    console.log('ast = ', ast);
    const plugin = (node) => {
      if (node.type === NodeTypes.TEXT) {
        node.content = node.content + 'mini-vue';
      }
    };
    transform(ast, {
      nodeTransforms: [plugin],
    });

    const nodeText = ast.children[0].children[0];
    expect(nodeText.content).toBe('hi, mini-vue');
  });
});