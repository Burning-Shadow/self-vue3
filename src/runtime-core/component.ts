export function createComponentInstance(vnode) {
  const component = { vnode, type: vnode.type };
  return component;
};

export function setupComopnent(instance) {
  // initProps();
  // initSlots();

  setupStatefulComponent(instance);
};

function setupStatefulComponent(instance: any) {
  const Component = instance.type;

  const { setup } = Component;
  if (setup) {
    /**
     * 若返回内容为 function 则该 function 为 render 函数
     * 若返回 Object 则将该 Object 注入组件上下文中
    */
    const setupResult = setup();

    handleSetupResult(instance, setupResult);
  }
}

function handleSetupResult(instance, setupResult: any) {
  // Object
  if (typeof setupResult === 'object') {
    instance.setupState = setupResult;
  }

  finishComponentSetup(instance);

  // TODO Function
}

function finishComponentSetup(instance: any) {
  const Component = instance.type;

  if (Component.render) {
    instance.render = Component.render;
  }
}
