import { shallowReadonly } from "../reactivity/reactive";
import { initProps } from "./componentProps";
import { PublicInstanceProxyHandlers } from "./componentPublicInstance";

export function createComponentInstance(vnode) {
  const component = {
    vnode,
    type: vnode.type,
    setupState: {},
    props: {},
  };
  return component;
};

export function setupComopnent(instance) {
  initProps(instance, instance.vnode.props);
  // initSlots();

  setupStatefulComponent(instance);
};

function setupStatefulComponent(instance: any) {
  const Component = instance.type;

  // 设置组件代理，用于通过 this.xxx 访问组建内部的属性
  instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);

  const { setup } = Component;
  if (setup) {
    /**
     * 若返回内容为 function 则该 function 为 render 函数
     * 若返回 Object 则将该 Object 注入组件上下文中
    */
    const setupResult = setup(shallowReadonly(instance.props)); // props 仅做了一层 readonly 属性改写，故此处为 shallowReadonly

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
