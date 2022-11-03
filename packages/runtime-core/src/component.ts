import { shallowReadonly, proxyRefs } from "@guide-self-vue3/reactivity";
import { emit } from "./componentEmit";
import { initProps } from "./componentProps";
import { PublicInstanceProxyHandlers } from "./componentPublicInstance";
import { initSlots } from "./componentSlots";

export function createComponentInstance(vnode, parent) {
  console.log('createComponentInstance = ', parent);
  const component = {
    vnode,
    type: vnode.type,
    setupState: {},
    props: {},
    slots: {},
    provides: parent ? parent.provides : {},
    parent,
    isMounted: false,
    subTree: {},
    emit: () => { },
  };
  component.emit = emit.bind(null, component) as any;

  return component;
};

export function setupComopnent(instance) {
  initProps(instance, instance.vnode.props);
  initSlots(instance, instance.vnode.children);

  setupStatefulComponent(instance);
};

function setupStatefulComponent(instance: any) {
  const Component = instance.type;

  // 设置组件代理，用于通过 this.xxx 访问组建内部的属性
  instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);

  const { setup } = Component;
  if (setup) {
    setCurrentInstance(instance);

    /**
     * 若返回内容为 function 则该 function 为 render 函数
     * 若返回 Object 则将该 Object 注入组件上下文中
    */
    const setupResult = setup(shallowReadonly(instance.props), {
      emit: instance.emit,
    }); // props 仅做了一层 readonly 属性改写，故此处为 shallowReadonly

    setCurrentInstance(null);

    handleSetupResult(instance, setupResult);
  }
}

function handleSetupResult(instance, setupResult: any) {
  // Object
  if (typeof setupResult === 'object') {
    instance.setupState = proxyRefs(setupResult);
  }

  finishComponentSetup(instance);

  // TODO Function
}

function finishComponentSetup(instance: any) {
  const Component = instance.type;

  if (compiler && !Component.render) {
    if (Component.template) {
      Component.render = compiler(Component.template);
    }
  }
  instance.render = Component.render;
}

export function getCurrentInstance() {
  return currentInstance;
};

let currentInstance = null;
function setCurrentInstance(instance: any) {
  currentInstance = instance;
};

let compiler;
export function registerRuntimeCompiler(_compiler) {
  compiler = _compiler;
}
