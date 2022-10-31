import { NodeTypes } from "./ast";

const OPEN_DELIMETER = '{{';
const CLOSE_DELIMETER = '}}';

export function baseParse(content: string) {
  const context = createParserContext(content);
  return createRoot(parseChildren(context));
};

function parseChildren(context: any): Array<any> {
  const nodes: Array<any> = [];
  let node;
  if (context.source.startsWith(OPEN_DELIMETER)) {
    node = parseInterpolation(context);
  }
  nodes.push(node);

  return nodes;
};

function parseInterpolation(context: any) {
  const closeIdx = context.source.indexOf(
    CLOSE_DELIMETER,
    OPEN_DELIMETER.length,
  );
  advanceBy(context, OPEN_DELIMETER.length);

  const rawContentLength = closeIdx - OPEN_DELIMETER.length;
  const content = context.source.slice(0, rawContentLength).trim();

  advanceBy(context, rawContentLength + CLOSE_DELIMETER.length);

  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content,
    }
  };
};

function advanceBy(context: any, length: number) {
  context.source = context.source.slice(length);
};

function createRoot(children: Array<any>): any {
  return { children };
};

function createParserContext(content: string): any {
  return { source: content };
};
