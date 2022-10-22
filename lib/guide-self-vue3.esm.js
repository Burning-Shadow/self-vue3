/**
 * |: 均为 0 则为 0 ———— 修改
 * &: 均为 1 则为 1 ———— 查找
*/
var SHAPE_FLAGS;
(function (SHAPE_FLAGS) {
    SHAPE_FLAGS[SHAPE_FLAGS["ELEMENT"] = 1] = "ELEMENT";
    SHAPE_FLAGS[SHAPE_FLAGS["STATEFUL_COMPONENT"] = 2] = "STATEFUL_COMPONENT";
    SHAPE_FLAGS[SHAPE_FLAGS["TEXT_CHILDREN"] = 4] = "TEXT_CHILDREN";
    SHAPE_FLAGS[SHAPE_FLAGS["ARRAY_CHILDREN"] = 8] = "ARRAY_CHILDREN";
})(SHAPE_FLAGS || (SHAPE_FLAGS = {}));

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
    // debugger;
    /**
     * 判断 vnode 为 element 亦或为 component
    */
    const { shapeFlag } = vnode;
    if (shapeFlag & SHAPE_FLAGS.ELEMENT) {
        // typeof type === 'string'
        processElement(vnode, container);
    }
    else if (shapeFlag & SHAPE_FLAGS.STATEFUL_COMPONENT) {
        // isObject(type)
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
    const { type, props, children, shapeFlag } = vnode;
    const el = (vnode.el = document.createElement(type));
    /**
     * 判断 vnode.children 为 string 亦或为 Array
     *
     * 之所以采取位运算的形式是因为可以保证双类型：
     *  eg: 0101【对应数值为5】即代表该 vnode 既是 ELEMENT类型 又是 TEXT_CHILDREN类型
    */
    if (shapeFlag & SHAPE_FLAGS.TEXT_CHILDREN) {
        // typeof children === 'string'
        el.textContent = children;
    }
    else if (shapeFlag & SHAPE_FLAGS.ARRAY_CHILDREN) {
        // Array.isArray(children)
        // vnode
        mountChildren(children, el);
    }
    const isNativeEvent = (key) => /^on[A-Z]/.test(key);
    // props【attribute】
    for (const key in props) {
        if (isNativeEvent(key)) {
            const event = key.slice(2).toLocaleLowerCase();
            // 此处的 props[key] 为 callback，为防止混淆故未在上方进行 props[key] 对提前解析
            el.addEventListener(event, props[key]);
        }
        else {
            el.setAttribute(key, props[key]);
        }
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
        shapeFlag: getShapeFlag(type),
        el: null,
    };
    // children
    if (typeof children === 'string') {
        vnode.shapeFlag |= SHAPE_FLAGS.TEXT_CHILDREN;
    }
    else if (Array.isArray(children)) {
        vnode.shapeFlag &= SHAPE_FLAGS.ARR_CHILDREN;
    }
    return vnode;
}
function getShapeFlag(type) {
    return typeof type === 'string' ? SHAPE_FLAGS.ELEMENT : SHAPE_FLAGS.STATEFUL_COMPONENT;
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

export { createApp, h };
