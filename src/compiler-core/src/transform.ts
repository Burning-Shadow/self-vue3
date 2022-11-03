import { NodeTypes } from "./ast";
import { TO_DISPLAY_STRING } from "./runtimeHelpers";

export function transform(root: any, options: any = {}) {
  const context = createTransformContext(root, options);
  /**
   * 1. dfs
   * 2. 修改 text content
  */
  traversNode(root, context);
  createRootCodegen(root);

  root.helpers.push(...context.helpers.keys());
};

function createRootCodegen(root: any) {
  const [child] = root.children;
  if (child.type === NodeTypes.ELEMENT && child.codegenNode) {
    root.codegenNode = child.codegenNode;
  } else {
    root.codegenNode = child;
  }
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
  const exitFuncs: any[] = [];
  for (const transform of nodeTransforms) {
    const onExit = transform(node, context);
    if (onExit) {
      exitFuncs.push(onExit);
    }
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

  /**
   * 防止部分 case 无法触及（前边已经轮询过去），通过 exitFuncs 缓存并随后先入后出的执行完毕
  */
  let i = exitFuncs.length;
  while (i--) {
    exitFuncs[i]();
  }
};

function traversChildren(parentNode: any, context: any) {
  const { children } = parentNode;
  for (const childNode of children) {
    traversNode(childNode, context);
  }
};
