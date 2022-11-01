import { NodeTypes } from "./ast";
import { helperMapName, TO_DISPLAY_STRING } from "./transforms/runtimeHelpers";

export function generator(ast) {
  const context = createCodegenContext();
  const { push } = context;

  generateFunctionPreamble(ast, context);

  const functionName = 'render';
  const args = ['_ctx', '_cache'];
  const signature = args.join(', ');

  push(`function ${functionName}(${signature}){`);
  push(`return `);
  genNode(ast.codegenNode, context);
  push('}');

  return { code: context.code };
};

function createCodegenContext(): any {
  const context = {
    code: '',
    push(source) {
      context.code += source;
    },
    helper(key) {
      return `${helperMapName[key]}`;
    },
  };

  return context;
};

function genNode(node: any, context: any) {
  switch (node.type) {
    case NodeTypes.TEXT:
      genText(node, context);
      break;
    case NodeTypes.INTERPOLATION:
      genInterpolation(node, context);
      break;
    case NodeTypes.SIMPLE_EXPRESSION:
      genExpression(node, context);
      break;
    default:
      break;
  }
};

// 前导字符串拼接
function generateFunctionPreamble(ast: any, context: any) {
  const { push } = context;
  const VueBinging = 'Vue';
  const aliaHelper = (s) => `${helperMapName[s]}: _${helperMapName[s]}`;

  if (ast.helpers.length > 0) {
    push(`const { ${ast.helpers.map(aliaHelper).join(', ')} } = ${VueBinging}\n`);
  }

  push('return ');
};

function genText(node: any, context: any) {
  const { push } = context;
  push(`'${node.content}'`);
}

function genInterpolation(node: any, context: any) {
  const { push, helper } = context;
  push(`_${helper(TO_DISPLAY_STRING)}(`);
  genNode(node.content, context);
  push(')');
}

function genExpression(node: any, context: any) {
  const { push } = context;
  push(`${node.content}`);
}
