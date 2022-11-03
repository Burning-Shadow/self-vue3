import { createVNodeCall, NodeTypes } from "../ast";
import { CREATE_ELEMENT_VNODE } from "../runtimeHelpers";

export function transformElement(node, context) {
  if (node.type === NodeTypes.ELEMENT) {
    return () => {
      context.helper(CREATE_ELEMENT_VNODE);

      // TODO 处理 props
      let vnodeProps;

      // TODO 处理 tag
      const { tag: vnodeTag } = node;

      // 处理 children
      const { children } = node;
      const [child] = children;
      let vnodeChildren = child;

      node.codegenNode = createVNodeCall(
        context,
        vnodeTag,
        vnodeProps,
        vnodeChildren
      );
    }
  };
};
