import { NodeTypes } from "./ast";

export function transform(root: any, options: any) {
  const context = createTransformContext(root, options);
  /**
   * 1. dfs
   * 2. 修改 text content
  */
  traversNode(root, context);
};

function createTransformContext(root: any, options: any) {
  const context = { root, nodeTransforms: options.nodeTransforms || [] };

  return context;
}

function traversNode(node: any, context: any) {
  // element
  const { nodeTransforms } = context;
  for (const transform of nodeTransforms) {
    transform(node);
  }

  traversChildren(node, context);
}

function traversChildren(node: any, context: any) {
  const { children } = node;
  if (children) {
    for (const childNode of children) {
      traversNode(childNode, context);
    }
  }
}
