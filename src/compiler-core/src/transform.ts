import { NodeTypes } from "./ast";
import { TO_DISPLAY_STRING } from "./transforms/runtimeHelpers";

export function transform(root: any, options: any = {}) {
  const context = createTransformContext(root, options);
  /**
   * 1. dfs
   * 2. 修改 text content
  */
  traversNode(root, context);
  createRootCodegen(root);

  root.helpers = [...context.helpers.keys()];
};

function createRootCodegen(root: any) {
  root.codegenNode = root.children[0];
};

function createTransformContext(root: any, options: any) {
  const context = {
    root,
    nodeTransforms: options.nodeTransforms || [],
    helpers: new Map(),
    helper(key) {
      context.helpers.set(key, 1);
    },
  };

  return context;
};

function traversNode(node: any, context: any) {
  // element
  const { nodeTransforms } = context;
  for (const transform of nodeTransforms) {
    transform(node);
  }

  // 判断
  switch (node.type) {
    case NodeTypes.INTERPOLATION:
      context.helper(TO_DISPLAY_STRING);
      break;
    case NodeTypes.ROOT:
    case NodeTypes.ELEMENT:
      traversChildren(node, context);
      break;
    default:
      break;
  }
};

function traversChildren(node: any, context: any) {
  const { children } = node;
  for (const childNode of children) {
    traversNode(childNode, context);
  }
};
