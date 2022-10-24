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

function createAppAPI(render) {
    return function createApp(rootComponent) {
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

const extend = Object.assign;
const isObject = (val) => val && typeof val === 'object';
const hasChanged = (newValue, value) => !Object.is(newValue, value);
const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
const toHandlerKay = (str) => str ? `on${capitalize(str)}` : '';
const camelize = (str) => str.replace(/-(\w)/g, (_, c) => (c ? c.toUpperCase() : ''));
const isEmptyObject = (obj) => Object.keys(obj).length === 0;

let activeEffect; // 当前活跃的 ReactiveEffect 实例（fn），用于 get 操作时收纳入依赖回调队列
let shouldTrack; // 配合 stop API 使用，避免 stop 之后再执行 get 操作时重新收集依赖
class ReactiveEffect {
    constructor(fn, scheduler) {
        this.active = true; // 是否为响应式
        this.deps = []; // dependencys
        this._fn = fn;
        this.scheduler = scheduler;
    }
    // 执行回调
    run() {
        // 区分是否为 stop 状态
        if (!this.active) {
            return this._fn();
        }
        shouldTrack = true;
        activeEffect = this;
        const res = this._fn();
        // reset
        shouldTrack = false;
        activeEffect = undefined;
        return res;
    }
    // 删除回调
    stop() {
        if (this.active) {
            cleanupEffect(this);
            if (this.onStop) {
                this.onStop();
            }
            this.active = false;
        }
    }
}
function cleanupEffect(effect) {
    effect.deps.forEach((dep) => {
        dep.delete(effect);
    });
}
function isTracking() {
    return shouldTrack && activeEffect !== undefined;
}
function trackEffects(dep) {
    if (dep.has(activeEffect))
        return;
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
}
function triggerEffects(dep) {
    for (const effect of dep) {
        if (effect.scheduler)
            effect.scheduler();
        else
            effect.run();
    }
}
const targetMap = new Map();
function track(target, key) {
    if (!isTracking())
        return;
    // target -> key -> dep
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        depsMap = new Map();
        targetMap.set(target, depsMap);
    }
    let dep = depsMap.get(key);
    if (!dep) {
        dep = new Set();
        depsMap.set(key, dep);
    }
    trackEffects(dep);
}
function trigger(target, key) {
    let depsMap = targetMap.get(target);
    let dep = depsMap.get(key);
    triggerEffects(dep);
}
function effect(fn, options = {}) {
    const { scheduler } = options;
    const _effect = new ReactiveEffect(fn, scheduler);
    extend(_effect, options);
    _effect.run();
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
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
        // dependency collect
        if (!isReadonly) {
            track(target, key);
        }
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

function createComponentInstance(vnode, parent) {
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
function handleSetupResult(instance, setupResult) {
    // Object
    if (typeof setupResult === 'object') {
        instance.setupState = proxyRefs(setupResult);
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
function getCurrentInstance() {
    return currentInstance;
}
let currentInstance = null;
function setCurrentInstance(instance) {
    currentInstance = instance;
}

function provide(key, value) {
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        let { provides } = currentInstance;
        const parentProvides = currentInstance.parent.provides;
        /**
         * provides 赋值操作只在初始化时执行
         *  而初始化的标志即为： currentInstance.provides === currInstance.parent.provides
        */
        if (provides === parentProvides) {
            provides = currentInstance.provides = Object.create(parentProvides);
        }
        provides[key] = value;
    }
}
function inject(key, defaultValue) {
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        const parentProvides = currentInstance.parent.provides;
        if (key in parentProvides) {
            return parentProvides[key];
        }
        else if (defaultValue) {
            if (typeof defaultValue === 'function')
                return defaultValue();
            return defaultValue;
        }
    }
}

function createRenderer(options) {
    const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert, } = options;
    function render(nVNode, container) {
        patch(null, nVNode, container, null);
    }
    function patch(oVNode, nVNode, container, parent) {
        // debugger;
        const { type, shapeFlag } = nVNode;
        switch (type) {
            case FRAGMENT:
                /**
                 * Fragment: 只渲染 children
                 *  起因为 ———— slot 渲染时【src/runtime-core/helpers/renderSlot.ts : renderSlots】会执行 createVNode('div', {}, slot(props))，包裹一层 div
                 *  该场景下为减少嵌套我们需引入新 vnode.type ———— Fragment
                */
                processFragment(oVNode.children, nVNode.children, container, parent);
                break;
            case TEXT:
                processText(oVNode, nVNode, container);
                break;
            default:
                /**
                 * 默认判断 vnode 为 element 亦或为 component
                */
                if (shapeFlag & SHAPE_FLAGS.ELEMENT) {
                    // typeof type === 'string'
                    processElement(oVNode, nVNode, container, parent);
                }
                else if (shapeFlag & SHAPE_FLAGS.STATEFUL_COMPONENT) {
                    // isObject(type)
                    processComponent(oVNode, nVNode, container, parent);
                }
                break;
        }
    }
    function processText(oVNode, nVNode, container) {
        const { children } = nVNode;
        const textNode = (nVNode.el = document.createTextNode(children));
        container.append(textNode);
    }
    function processFragment(oChildren, nChildren, container, parent) {
        // console.log(nChildren);
        mountChildren(nChildren, container, parent);
    }
    function processElement(oVNode, nVNode, container, parent) {
        if (!oVNode) {
            console.log('init');
            mountElement(nVNode, container, parent);
        }
        else {
            // component update
            patchElement(oVNode, nVNode);
        }
    }
    function patchElement(oVNode, nVNode, container) {
        console.log('patch element');
        console.log('oldVNode = ', oVNode);
        console.log('newVNode = ', nVNode);
        // TODO 处理 element 更新对比
        const oldProps = oVNode.props || {};
        const newProps = nVNode.props || {};
        /**
         * TODO 这里没搞明白为什么要将 oVNode.el 赋值给 nVNode.el
         * 因为下次调用时 nVNode 会变为 oVNode，故
        */
        const el = (nVNode.el = oVNode.el);
        patchProps(el, oldProps, newProps);
    }
    function patchProps(el, oldProps, newProps) {
        // 若前后 props 相等则直接 return
        if (oldProps === newProps)
            return;
        for (const key in newProps) {
            const prevProp = oldProps[key];
            const nextProp = newProps[key];
            if (prevProp !== nextProp) {
                // update
                hostPatchProp(el, key, prevProp, nextProp);
            }
        }
        // 若前者为 {} 亦无需比较
        if (isEmptyObject(oldProps))
            return;
        for (const key in oldProps) {
            if (!(key in newProps)) {
                hostPatchProp(el, key, oldProps[key], null);
            }
        }
    }
    function processComponent(oVNode, nVNode, container, parent) {
        mountComponent(nVNode, container, parent);
    }
    function mountComponent(vnode, container, parent) {
        const instance = createComponentInstance(vnode, parent);
        setupComopnent(instance);
        setupRenderEffect(instance, vnode, container);
    }
    function mountElement(vnode, container, parent) {
        const { type, props, children, shapeFlag } = vnode;
        const el = (vnode.el = hostCreateElement(type));
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
            mountChildren(children, el, parent);
        }
        // props【attribute】
        for (const key in props) {
            hostPatchProp(el, key, null, props[key]);
        }
        hostInsert(el, container);
    }
    function mountChildren(childVNodes, container, parent) {
        childVNodes.forEach(vnode => {
            patch(null, vnode, container, parent);
        });
    }
    function setupRenderEffect(instance, vnode, container) {
        /**
         * 利用 effect 收集，包裹 render 函数
        */
        effect(() => {
            if (!instance.isMounted) {
                // init
                const { proxy } = instance;
                // 虚拟节点树 && 绑定组件代理，保证 this 可以取到值
                const subTree = (instance.subTree = instance.render.call(proxy));
                // vnode<Element> -> patch
                // vnode -> Element -> mountElement
                patch(null, subTree, container, instance);
                vnode.el = subTree.el;
                instance.isMounted = true;
            }
            else {
                // update logic
                const { proxy } = instance;
                // 虚拟节点树 && 绑定组件代理，保证 this 可以取到值
                const subTree = instance.render.call(proxy);
                const prevSubTree = instance.subTree;
                instance.subTree = subTree;
                patch(prevSubTree, subTree, container, instance);
            }
        });
    }
    return { createApp: createAppAPI(render) };
}

function createElement(type) {
    console.log('createElement -------------');
    return document.createElement(type);
}
function patchProp(el, key, prevValue, nextValue) {
    console.log('patchProp -------------');
    const isNativeEvent = (key) => /^on[A-Z]/.test(key);
    if (isNativeEvent(key)) {
        const event = key.slice(2).toLocaleLowerCase();
        // 此处的 props[key]（nextValue） 为 callback，为防止混淆故未在上方进行 props[key] 对提前解析
        el.addEventListener(event, nextValue);
    }
    else {
        if (nextValue === undefined || nextValue === null) {
            // 值被删除时移除对应 props 属性
            el.removeAttribute(key);
        }
        else {
            el.setAttribute(key, nextValue);
        }
    }
}
function insert(el, parent) {
    console.log('insert -------------');
    parent.append(el);
}
const renderer = createRenderer({
    createElement,
    patchProp,
    insert,
});
function createApp(...args) {
    return renderer.createApp(...args);
}

/**
 * 同样为响应式，reactive 针对的是对象，而 ref 则针对基础类型
 * 故我们需以 RefImpl 类进行包裹，并以 .value 的形式调用
*/
class RefImpl {
    constructor(value) {
        this._rawValue = value;
        // 若为 obj 则处理为响应式对象
        this._value = convert(value);
        this.dep = new Set();
    }
    ;
    get value() {
        trackRefValue(this);
        return this._value;
    }
    ;
    set value(newValue) {
        if (!hasChanged(newValue, this._rawValue))
            return;
        this._rawValue = newValue;
        this._value = convert(newValue);
        triggerEffects(this.dep);
    }
    ;
}
function ref(value) {
    return new RefImpl(value);
}
function trackRefValue(ref) {
    if (isTracking()) {
        trackEffects(ref.dep);
    }
}
function convert(value) {
    return isObject(value) ? reactive(value) : value;
}
function isRef(ref) {
    return ref instanceof RefImpl;
}
function unRef(ref) {
    return isRef(ref) ? ref.value : ref;
}
function proxyRefs(objectWithRefs) {
    return new Proxy(objectWithRefs, {
        get(target, key) {
            return unRef(Reflect.get(target, key));
        },
        set(target, key, value) {
            if (isRef(target[key]) && !isRef(value)) {
                return (target[key].value = value);
            }
            else {
                return Reflect.set(target, key, value);
            }
        },
    });
}

export { createApp, createAppAPI, createElement, createRenderer, createTextVNode, getCurrentInstance, h, inject, insert, patchProp, provide, proxyRefs, ref, renderSlots };
