import { NodeTypes } from "./ast";

const OPEN_DELIMETER = '{{';
const CLOSE_DELIMETER = '}}';

const enum TagType {
  START,
  END,
};

export function baseParse(content: string) {
  const context = createParserContext(content);
  return createRoot(parseChildren(context));
};

function parseChildren(context: any): Array<any> {
  const nodes: Array<any> = [];
  let node;
  const { source } = context;

  if (source.startsWith(OPEN_DELIMETER)) {
    node = parseInterpolation(context);
  } else if (source.startsWith('<')) {
    if (/[a-z]/i.test(source[1])) {
      node = parseElement(context);
    }
  } else {
    node = parseText(context);
  }

  nodes.push(node);

  return nodes;
};

function parseText(context: any): any {
  const content = parseTextData(context);


  return {
    type: NodeTypes.TEXT,
    content,
  };
}

function parseTextData(context: any, length?: number) {
  const content = context.source.slice(0, length);
  advanceBy(context, content.length);

  return content;
};

function parseElement(context: any) {
  // 解析 tag
  const element = parseTag(context, TagType.START);
  parseTag(context, TagType.END);

  return element;
}

function parseTag(context: any, type: TagType) {
  const match: any = /^<\/?([a-z]+)/i.exec(context.source);
  // 删除已处理的代码
  advanceBy(context, match[0].length);
  advanceBy(context, 1);

  const [, tag] = match;

  if (tag === TagType.END) return;
  return {
    type: NodeTypes.ELEMENT,
    tag,
  };
}

function parseInterpolation(context: any) {
  const closeIdx = context.source.indexOf(
    CLOSE_DELIMETER,
    OPEN_DELIMETER.length,
  );
  advanceBy(context, OPEN_DELIMETER.length);

  const rawContentLength = closeIdx - OPEN_DELIMETER.length;
  const content = parseTextData(context, rawContentLength).trim();

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
