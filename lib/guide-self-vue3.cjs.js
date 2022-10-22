'use strict';

const isObject = (val) => val && typeof val === 'object';

const publicPropertiesMap = {
    /**
     * IMPORTANT!!!
     *
     * 这里如果单纯赋值那么无法获取到，因为 renderer.ts 中 mountElement 函数处缓存完毕的 el 为空
     * 只有等 patch 结束后【renderer.ts setupRenderEffect】，将 subTree 赋值给 vnode.$el 后 $el 方可正常访问
    */
    $el: (i) => i.vnode.el,
    $data: (i) => i.vnode.data,
};
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        const { setupState } = instance;
        if (key in setupState)
            return setupState[key];
        const publicPropertyGetter = publicPropertiesMap[key];
        if (publicPropertyGetter)
            return publicPropertyGetter(instance);
    },
};

function createComponentInstance(vnode) {
    const component = { vnode, type: vnode.type, setupState: {} };
    return component;
}
function setupComopnent(instance) {
    // initProps();
    // initSlots();
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const Component = instance.type;
    // 设置组件代理，用于通过 this.xxx 访问组建内部的属性
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
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
function handleSetupResult(instance, setupResult) {
    // Object
    if (typeof setupResult === 'object') {
        instance.setupState = setupResult;
    }
    finishComponentSetup(instance);
    // TODO Function
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    if (Component.render) {
        instance.render = Component.render;
    }
}

function render(vnode, container) {
    patch(vnode, container);
}
function patch(vnode, container) {
    /**
     * 判断 vnode 为 element 亦或为 component
    */
    const { type } = vnode;
    if (typeof type === 'string') {
        processElement(vnode, container);
    }
    else if (isObject(type)) {
        processComponent(vnode, container);
    }
}
function processElement(vnode, container) {
    mountElement(vnode, container);
}
function processComponent(vnode, container) {
    mountComponent(vnode, container);
}
function mountComponent(vnode, container) {
    const instance = createComponentInstance(vnode);
    setupComopnent(instance);
    setupRenderEffect(instance, vnode, container);
}
function mountElement(vnode, container) {
    const { type, props, children } = vnode;
    const el = (vnode.el = document.createElement(type));
    // vnode.children 分为两种类型 ———— string | Array
    if (typeof children === 'string') {
        el.textContent = children;
    }
    else if (Array.isArray(children)) {
        // vnode
        mountChildren(children, el);
    }
    // props【attribute】
    for (const key in props) {
        el.setAttribute(key, props[key]);
    }
    container.append(el);
}
function mountChildren(vnodes, container) {
    vnodes.forEach(vnode => {
        patch(vnode, container);
    });
}
function setupRenderEffect(instance, vnode, container) {
    const { proxy } = instance;
    // 虚拟节点树 && 绑定组件代理，保证 this 可以取到值
    const subTree = instance.render.call(proxy);
    // vnode<Element> -> patch
    // vnode -> Element -> mountElement
    patch(subTree, container);
    vnode.el = subTree.el;
}

function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        el: null,
    };
    return vnode;
}

function createApp(rootComponent) {
    return {
        mount(rootContainer) {
            /**
             * component to vnode
             * 所有逻辑操作均基于 vnode 进行处理
            */
            const vnode = createVNode(rootComponent);
            render(vnode, rootContainer);
        },
    };
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

exports.createApp = createApp;
exports.h = h;
