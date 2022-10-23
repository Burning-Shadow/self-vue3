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
    SHAPE_FLAGS[SHAPE_FLAGS["SLOT_CHILDREN"] = 16] = "SLOT_CHILDREN";
})(SHAPE_FLAGS || (SHAPE_FLAGS = {}));

const extend = Object.assign;
const isObject = (val) => val && typeof val === 'object';
const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
const toHandlerKay = (str) => str ? `on${capitalize(str)}` : '';
const camelize = (str) => str.replace(/-(\w)/g, (_, c) => (c ? c.toUpperCase() : ''));

function triggerEffects(dep) {
    for (const effect of dep) {
        if (effect.scheduler)
            effect.scheduler();
        else
            effect.run();
    }
}
const targetMap = new Map();
function trigger(target, key) {
    let depsMap = targetMap.get(target);
    let dep = depsMap.get(key);
    triggerEffects(dep);
}

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
function createGetter(isReadonly = false, shallow = false) {
    return function (target, key) {
        if (key === "__v_isReactive" /* ReactiveFlags.IS_REACTIVE */) {
            return !isReadonly;
        }
        else if (key === "__v_isReadonly" /* ReactiveFlags.IS_READONLY */) {
            return isReadonly;
        }
        const res = Reflect.get(target, key);
        if (isObject(res))
            return isReadonly ? readonly(res) : reactive(res);
        if (shallow)
            return res;
        return res;
    };
}
function createSetter() {
    return function (target, key, value) {
        const res = Reflect.set(target, key, value);
        // trigger dependency
        trigger(target, key);
        return res;
    };
}
const mutableHandlers = {
    get,
    set,
};
const readonlyHandlers = {
    get: readonlyGet,
    set(target, key, value) {
        console.warn(`${value} can not be set into ${Reflect.get(target, key)} because this attribute is readonly`);
        return true;
    },
};
const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
    get: shallowReadonlyGet,
});

function createReactiveObject(target, baseHandlers) {
    if (!isObject(target)) {
        console.error(`target ${target} must be an Object`);
        return;
    }
    return new Proxy(target, baseHandlers);
}
function reactive(raw) {
    return createReactiveObject(raw, mutableHandlers);
}
function readonly(raw) {
    return createReactiveObject(raw, readonlyHandlers);
}
function shallowReadonly(raw) {
    return createReactiveObject(raw, shallowReadonlyHandlers);
}

function emit(instance, event, ...args) {
    // console.log(`emit = ${emit}`);
    const { props } = instance;
    const handlerName = toHandlerKay(camelize(event));
    const handler = props[handlerName];
    handler && handler(...args);
}

function initProps(instance, rawProps) {
    // console.log("initProps");
    instance.props = rawProps || {};
}

const publicPropertiesMap = {
    /**
     * IMPORTANT!!!
     *
     * 这里如果单纯赋值那么无法获取到，因为 renderer.ts 中 mountElement 函数处缓存完毕的 el 为空
     * 只有等 patch 结束后【renderer.ts setupRenderEffect】，将 subTree 赋值给 vnode.$el 后 $el 方可正常访问
    */
    $el: (i) => i.vnode.el,
    $data: (i) => i.vnode.data,
    $slots: (i) => i.slots,
};
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        const { setupState, props } = instance;
        if (key in setupState)
            return setupState[key];
        else if (hasOwn(props, key))
            return props[key];
        const publicPropertyGetter = publicPropertiesMap[key];
        if (publicPropertyGetter)
            return publicPropertyGetter(instance);
    },
};

function initSlots(instance, children) {
    const { vnode } = instance;
    if (vnode.shapeFlag & SHAPE_FLAGS.SLOT_CHILDREN) {
        normalizeObjectSlots(children, instance.slots);
    }
}
function normalizeObjectSlots(children, slots) {
    for (const key in children) {
        const value = children[key];
        // 直接修改引用
        slots[key] = (props) => normalizeSlotValue(value(props));
    }
}
function normalizeSlotValue(value) {
    return Array.isArray(value) ? value : [value];
}

function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        slots: {},
        emit: () => { },
    };
    component.emit = emit.bind(null, component);
    return component;
}
function setupComopnent(instance) {
    initProps(instance, instance.vnode.props);
    initSlots(instance, instance.vnode.children);
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
        const setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit,
        }); // props 仅做了一层 readonly 属性改写，故此处为 shallowReadonly
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

const FRAGMENT = Symbol('Fragment');
const TEXT = Symbol('Text');
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
        vnode.shapeFlag |= SHAPE_FLAGS.ARRAY_CHILDREN;
    }
    /**
     * 判断是否为 slot children:
    */
    if (vnode.shapeFlag & SHAPE_FLAGS.STATEFUL_COMPONENT) {
        if (typeof children === 'object') {
            vnode.shapeFlag |= SHAPE_FLAGS.SLOT_CHILDREN;
        }
    }
    return vnode;
}
function createTextVNode(text) {
    return createVNode('Text', {}, text);
}
function getShapeFlag(type) {
    return typeof type === 'string' ? SHAPE_FLAGS.ELEMENT : SHAPE_FLAGS.STATEFUL_COMPONENT;
}

function render(vnode, container) {
    patch(vnode, container);
}
function patch(vnode, container) {
    // debugger;
    const { type, shapeFlag } = vnode;
    switch (type) {
        case FRAGMENT:
            /**
             * Fragment: 只渲染 children
             *  起因为 ———— slot 渲染时【src/runtime-core/helpers/renderSlot.ts : renderSlots】会执行 createVNode('div', {}, slot(props))，包裹一层 div
             *  该场景下为减少嵌套我们需引入新 vnode.type ———— Fragment
            */
            processFragment(vnode.children, container);
            break;
        case TEXT:
            processText(vnode, container);
            break;
        default:
            /**
             * 默认判断 vnode 为 element 亦或为 component
            */
            if (shapeFlag & SHAPE_FLAGS.ELEMENT) {
                // typeof type === 'string'
                processElement(vnode, container);
            }
            else if (shapeFlag & SHAPE_FLAGS.STATEFUL_COMPONENT) {
                // isObject(type)
                processComponent(vnode, container);
            }
            break;
    }
}
function processText(vnode, container) {
    const { children } = vnode;
    const textNode = (vnode.el = document.createTextNode(children));
    container.append(textNode);
}
function processFragment(children, container) {
    console.log(children);
    mountChildren(children, container);
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
function mountChildren(childVNodes, container) {
    childVNodes.forEach(vnode => {
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

function renderSlots(slots, name, props) {
    const slot = slots[name];
    // debugger;
    if (slot) {
        if (typeof slot === 'function') {
            return createVNode(FRAGMENT, {}, slot(props));
        }
    }
}

export { createApp, createTextVNode, h, renderSlots };
