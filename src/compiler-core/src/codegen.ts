export function generator(ast) {
  const context = codegenContext();
  const { push } = context;

  push('return ');

  const functionName = 'render';
  const args = ['_ctx', '_cache'];
  const signature = args.join(', ');

  push(`function ${functionName}(${signature}){`);
  push(`return `);
  genNode(ast.codegenNode, context);
  push('}');

  return { code: context.code };
};

function codegenContext(): any {
  const context = {
    code: '',
    push(source) {
      context.code += source;
    }
  };

  return context;
};

function genNode(node: any, context: any) {
  const { push } = context;
  push(`'${node.content}'`);
};