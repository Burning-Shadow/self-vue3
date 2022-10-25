export function shouldComponentUpdate(oVNode: any, nVNode: any) {
  const { props: prevProps } = oVNode;
  const { props: nextProps } = nVNode;

  for (const key in nextProps) {
    if (nextProps[key] !== prevProps[key]) return true;
  }

  return false;
};
