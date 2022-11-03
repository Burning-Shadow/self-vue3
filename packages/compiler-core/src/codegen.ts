import { isString } from "@guide-self-vue3/shared";
import { NodeTypes } from "./ast";
import { CREATE_ELEMENT_VNODE, helperMapName, TO_DISPLAY_STRING } from "./runtimeHelpers";

export function generator(ast) {
  const context = createCodegenContext();
  const { push } = context;

  generateModulePreamble(ast, context);

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
      return `_${helperMapName[key]}`;
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
    case NodeTypes.ELEMENT:
      genElement(node, context);
      break;
    case NodeTypes.COMPOUND_EXPRESSION:
      genCompoundExpression(node, context);
      break;
    default:
      break;
  }
};

// 前导字符串拼接【此处的 preamble 即为 import 语句】
function generateModulePreamble(ast: any, context: any) {
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
  push(`${helper(TO_DISPLAY_STRING)}(`);
  genNode(node.content, context);
  push(')');
}

function genExpression(node: any, context: any) {
  const { push } = context;
  push(`${node.content}`);
}

function genElement(node: any, context: any) {
  const { push, helper } = context;
  const { tag = null, children = null, props = null } = node;
  push(`${helper(CREATE_ELEMENT_VNODE)}('${tag}', ${props}, `);
  genNode(children, context);

  push(')');
};

function genCompoundExpression(node: any, context: any) {
  const { push } = context;
  const { children } = node;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (isString(child)) {
      push(child);
    } else {
      genNode(child, context);
    }
  }
}
