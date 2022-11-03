'use strict';

function toDisplayString(value) {
    return String(value);
}

const extend = Object.assign;
const isObject = (val) => val && typeof val === 'object';
const isString = (val) => typeof val === 'string';
const hasChanged = (newValue, value) => !Object.is(newValue, value);
const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
const toHandlerKay = (str) => str ? `on${capitalize(str)}` : '';
const camelize = (str) => str.replace(/-(\w)/g, (_, c) => (c ? c.toUpperCase() : ''));
const isEmptyObject = (obj) => Object.keys(obj).length === 0;
function getSequence(arr) {
    const p = arr.slice();
    const result = [0];
    let i, j, u, v, c;
    const len = arr.length;
    for (i = 0; i < len; i++) {
        const arrI = arr[i];
        if (arrI !== 0) {
            j = result[result.length - 1];
            if (arr[j] < arrI) {
                p[i] = j;
                result.push(i);
                continue;
            }
            u = 0;
            v = result.length - 1;
            while (u < v) {
                c = (u + v) >> 1;
                if (arr[result[c]] < arrI) {
                    u = c + 1;
                }
                else {
                    v = c;
                }
            }
            if (arrI < arr[result[u]]) {
                if (u > 0) {
                    p[i] = result[u - 1];
                }
                result[u] = i;
            }
        }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
        result[u] = v;
        v = p[v];
    }
    return result;
}

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
        next: null,
        component: null,
        key: props === null || props === void 0 ? void 0 : props.key,
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
    $props: (i) => i.props,
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
    if (compiler && !Component.render) {
        if (Component.template) {
            Component.render = compiler(Component.template);
        }
    }
    instance.render = Component.render;
}
function getCurrentInstance() {
    return currentInstance;
}
let currentInstance = null;
function setCurrentInstance(instance) {
    currentInstance = instance;
}
let compiler;
function registerRuntimeCompiler(_compiler) {
    compiler = _compiler;
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

function shouldComponentUpdate(oVNode, nVNode) {
    const { props: prevProps } = oVNode;
    const { props: nextProps } = nVNode;
    for (const key in nextProps) {
        if (nextProps[key] !== prevProps[key])
            return true;
    }
    return false;
}

const queue = [];
let isFlushPnding = false;
const p = Promise.resolve();
function queueJobs(job) {
    if (!queue.includes(job)) {
        queue.push(job);
    }
    queueFlush();
}
function queueFlush() {
    if (isFlushPnding)
        return;
    isFlushPnding = true;
    nextTick(flushJobs);
}
function flushJobs() {
    isFlushPnding = false;
    let job;
    while (job = queue.shift()) {
        job && job();
    }
}
function nextTick(fn) {
    return fn ? p.then(fn) : p;
}

function createRenderer(options) {
    const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert, remove: hostRemove, setElementText: hostSetElementText, } = options;
    // first render
    function render(nVNode, container) {
        patch(null, nVNode, container, null, null);
    }
    function patch(oVNode, nVNode, container, parent, anchor) {
        // debugger;
        const { type, shapeFlag } = nVNode;
        switch (type) {
            case FRAGMENT:
                /**
                 * Fragment: 只渲染 children
                 *  起因为 ———— slot 渲染时【src/runtime-core/helpers/renderSlot.ts : renderSlots】会执行 createVNode('div', {}, slot(props))，包裹一层 div
                 *  该场景下为减少嵌套我们需引入新 vnode.type ———— Fragment
                */
                processFragment(oVNode.children, nVNode.children, container, parent, anchor);
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
                    processElement(oVNode, nVNode, container, parent, anchor);
                }
                else if (shapeFlag & SHAPE_FLAGS.STATEFUL_COMPONENT) {
                    // isObject(type)
                    processComponent(oVNode, nVNode, container, parent, anchor);
                }
                break;
        }
    }
    function processText(oVNode, nVNode, container) {
        const { children } = nVNode;
        const textNode = (nVNode.el = document.createTextNode(children));
        container.append(textNode);
    }
    function processFragment(oChildren, nChildren, container, parent, anchor) {
        // console.log(nChildren);
        mountChildren(nChildren, container, parent, anchor);
    }
    function processElement(oVNode, nVNode, container, parent, anchor) {
        if (!oVNode) {
            console.log('init');
            mountElement(nVNode, container, parent, anchor);
        }
        else {
            // component update
            patchElement(oVNode, nVNode, container, parent, anchor);
        }
    }
    function patchElement(oVNode, nVNode, container, parent, anchor) {
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
        patchChildren(oVNode, nVNode, el, parent, anchor);
        patchProps(el, oldProps, newProps);
    }
    function patchChildren(oVNode, nVNode, container, parent, anchor) {
        const { shapeFlag: prevShapeFlag, children: oChildren } = oVNode;
        const { shapeFlag: nextShapeFlag, children: nChildren } = nVNode;
        if (nextShapeFlag & SHAPE_FLAGS.TEXT_CHILDREN) {
            if (prevShapeFlag & SHAPE_FLAGS.ARRAY_CHILDREN) {
                /**
                 * Array -> Text
                */
                // 1. 清空老数组
                unmountChildren(oVNode.children);
                // 2. 设置新 text
                hostSetElementText(container, nChildren);
            }
            else {
                /**
                 * Text -> Text
                */
                if (oChildren !== nChildren) {
                    hostSetElementText(container, nChildren);
                }
            }
        }
        else {
            if (prevShapeFlag & SHAPE_FLAGS.TEXT_CHILDREN) {
                /**
                 * Array -> Text
                */
                hostSetElementText(container, '');
                mountChildren(nChildren, container, parent, anchor);
            }
            else {
                /**
                 * Array -> Array 【the diff algorithm】
                */
                patchKeyChildren(oChildren, nChildren, container, parent, anchor);
            }
        }
    }
    function patchKeyChildren(c1, c2, container, parent, parentAnchor) {
        const l2 = c2.length;
        let i = 0, e1 = c1.length - 1, e2 = l2 - 1;
        function isVNodeEqual(node1, node2) {
            return node1.type === node2.type && node1.key === node2.key;
        }
        /**
         * (a b) c
         * (a b) d e
        */
        while (i <= e1 && i <= e2) {
            const prevChild = c1[i];
            const nextChild = c2[i];
            if (!isVNodeEqual(prevChild, nextChild))
                break;
            patch(prevChild, nextChild, container, parent, parentAnchor);
            i++;
        }
        /**
         *   a (b c)
         * d e (b c)
        */
        while (i <= e1 && i <= e2) {
            const prevChild = c1[e1];
            const nextChild = c2[e2];
            if (!isVNodeEqual(prevChild, nextChild))
                break;
            patch(prevChild, nextChild, container, parent, parentAnchor);
            e1--;
            e2--;
        }
        /**
         * (a b)
         * (a b) c d
        */
        if (i > e1 && i <= e2) {
            const nextPosition = e2 + 1;
            const anchor = nextPosition < l2 ? c2[nextPosition].el : parentAnchor;
            while (i <= e2) {
                patch(null, c2[i], container, parent, anchor);
                i++;
            }
        }
        else if (i > e2 && i <= e1) {
            /**
             * (a b) c d
             * (a b)
            */
            while (i <= e1) {
                hostRemove(c1[i].el);
                i++;
            }
        }
        else {
            /**
             * 乱序部分
            */
            let s1 = i, s2 = i, patched = 0, needMove = false, maxNewIndexSoFar = 0;
            const toBePatched = e2 - s2 + 1;
            const keyToNewIndexMap = new Map();
            const newIndex2OldIndexMap = new Array(toBePatched).fill(0); // idx 映射表【e2 - (s2 + 1) 范围内的】
            for (let i = s2; i <= e2; i++) {
                const nextChild = c2[i];
                keyToNewIndexMap.set(nextChild.key, i);
            }
            /**
             * a b (c d) f g
             * a b (e c) f g
            */
            for (let i = s1; i <= e1; i++) {
                const prevChild = c1[i];
                if (patched >= toBePatched) {
                    hostRemove(prevChild.el);
                    continue;
                }
                let newIndex;
                if (prevChild.key !== null) {
                    newIndex = keyToNewIndexMap.get(prevChild.key);
                }
                else {
                    for (let j = s2; j <= e2; j++) {
                        if (isVNodeEqual(prevChild, c2[j])) {
                            newIndex = j;
                            break;
                        }
                    }
                }
                if (newIndex === undefined) {
                    hostRemove(prevChild.el);
                }
                else {
                    if (newIndex >= maxNewIndexSoFar) {
                        maxNewIndexSoFar = newIndex;
                    }
                    else {
                        needMove = true;
                    }
                    // 初始化 newIndex2OldIndexMap
                    newIndex2OldIndexMap[newIndex - s2] = (i + 1); // 由于 newIndex2OldIndexMap 数组中 0 有特殊意义，故赋值为 (i + 1) 避免问题
                    // 递归对比
                    patch(prevChild, c2[newIndex], container, parent, null);
                    patched++;
                }
            }
            const increasingNewIndexSequence = needMove ? getSequence(newIndex2OldIndexMap) : [];
            let pointer = increasingNewIndexSequence.length - 1;
            for (let i = toBePatched - 1; i >= 0; i--) {
                const nextIndex = i + s2;
                const nextChild = c2[nextIndex];
                const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null;
                if (newIndex2OldIndexMap[i] === 0) {
                    patch(null, nextChild, container, parent, anchor);
                }
                else if (needMove) {
                    if (pointer < 0 || i !== increasingNewIndexSequence[pointer]) {
                        // 移动位置
                        console.log('移动位置');
                        hostInsert(nextChild.el, container, anchor);
                    }
                    else {
                        pointer--;
                    }
                }
            }
        }
    }
    function unmountChildren(children) {
        for (const child of children) {
            const { el } = child;
            hostRemove(el);
        }
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
    function processComponent(oVNode, nVNode, container, parent, anchor) {
        if (!oVNode) {
            mountComponent(nVNode, container, parent, anchor);
        }
        else {
            // debugger;
            updateComponent(oVNode, nVNode);
        }
    }
    function updateComponent(oVNode, nVNode) {
        const instance = (nVNode.component = oVNode.component);
        if (shouldComponentUpdate(oVNode, nVNode)) {
            instance.next = nVNode; // 下次要更新的 vnode，便于后续 setupRenderEffect 的 update 逻辑调用
            instance.update();
        }
        else {
            // 不需要更新也得更新 el
            nVNode.el = oVNode.el;
            nVNode.vnode = nVNode;
        }
    }
    /**
     * init
    */
    function mountComponent(vnode, container, parent, anchor) {
        const instance = (vnode.component = createComponentInstance(vnode, parent));
        setupComopnent(instance);
        setupRenderEffect(instance, vnode, container, anchor);
    }
    function mountElement(vnode, container, parent, anchor) {
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
            mountChildren(children, el, parent, anchor);
        }
        // props【attribute】
        for (const key in props) {
            hostPatchProp(el, key, null, props[key]);
        }
        hostInsert(el, container, anchor);
    }
    function mountChildren(childVNodes, container, parent, anchor) {
        childVNodes.forEach(vnode => {
            patch(null, vnode, container, parent, anchor);
        });
    }
    function setupRenderEffect(instance, vnode, container, anchor) {
        /**
         * 利用 effect 收集，包裹 render 函数
        */
        instance.update = effect(() => {
            if (!instance.isMounted) {
                // init
                const { proxy } = instance;
                // 虚拟节点树 && 绑定组件代理，保证 this 可以取到值
                const subTree = (instance.subTree = instance.render.call(proxy, proxy));
                // vnode<Element> -> patch
                // vnode -> Element -> mountElement
                patch(null, subTree, container, instance, anchor);
                vnode.el = subTree.el;
                instance.isMounted = true;
            }
            else {
                // debugger;
                // update logic
                const { next: nVNode, vnode: oVNode } = instance;
                if (nVNode) {
                    nVNode.el = oVNode.el;
                    updateComponentPreRender(instance, nVNode);
                }
                const { proxy } = instance;
                // 虚拟节点树 && 绑定组件代理，保证 this 可以取到值
                const subTree = instance.render.call(proxy, proxy);
                const prevSubTree = instance.subTree;
                instance.subTree = subTree;
                patch(prevSubTree, subTree, container, instance, anchor);
            }
        }, {
            scheduler() {
                console.log('update scheduler');
                queueJobs(instance.update);
            }
        });
    }
    return { createApp: createAppAPI(render) };
}
function updateComponentPreRender(instance, nVNode) {
    // debugger;
    // 迭代更新
    instance.vnode = nVNode;
    instance.next = null;
    instance.props = nVNode.props;
}

function createElement(type) {
    console.log('createElement -------------');
    return document.createElement(type);
}
function patchProp(el, key, prevValue, nextValue) {
    // console.log('patchProp -------------');
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
function insert(el, parent, anchor) {
    // console.log('insert -------------');
    parent.insertBefore(el, anchor);
}
function remove(el) {
    const parent = el.parentNode;
    if (parent) {
        parent.removeChild(el);
    }
}
function setElementText(el, text) {
    el.textContent = text;
}
const renderer = createRenderer({
    createElement,
    patchProp,
    insert,
    remove,
    setElementText
});
function createApp(...args) {
    return renderer.createApp(...args);
}

var runtimeDom = /*#__PURE__*/Object.freeze({
    __proto__: null,
    createElement: createElement,
    patchProp: patchProp,
    insert: insert,
    remove: remove,
    setElementText: setElementText,
    createApp: createApp,
    createAppAPI: createAppAPI,
    h: h,
    renderSlots: renderSlots,
    createTextVNode: createTextVNode,
    createElementVNode: createVNode,
    getCurrentInstance: getCurrentInstance,
    registerRuntimeCompiler: registerRuntimeCompiler,
    inject: inject,
    provide: provide,
    createRenderer: createRenderer,
    nextTick: nextTick,
    toDisplayString: toDisplayString,
    ref: ref,
    proxyRefs: proxyRefs
});

const TO_DISPLAY_STRING = Symbol('toDisplayString');
const CREATE_ELEMENT_VNODE = Symbol('createElementVNode');
const helperMapName = {
    [TO_DISPLAY_STRING]: 'toDisplayString',
    [CREATE_ELEMENT_VNODE]: 'createElementVNode',
};

function generator(ast) {
    const context = createCodegenContext();
    const { push } = context;
    generateModulePreamble(ast, context);
    const functionName = 'render';
    const args = ['_ctx', '_cache'];
    const signature = args.join(', ');
    push(`function ${functionName}(${signature}){`);
    push(`return `);
    genNode(ast.codegenNode, context);
    push('}');
    return { code: context.code };
}
function createCodegenContext() {
    const context = {
        code: '',
        push(source) {
            context.code += source;
        },
        helper(key) {
            return `_${helperMapName[key]}`;
        },
    };
    return context;
}
function genNode(node, context) {
    switch (node.type) {
        case 0 /* NodeTypes.TEXT */:
            genText(node, context);
            break;
        case 2 /* NodeTypes.INTERPOLATION */:
            genInterpolation(node, context);
            break;
        case 3 /* NodeTypes.SIMPLE_EXPRESSION */:
            genExpression(node, context);
            break;
        case 4 /* NodeTypes.ELEMENT */:
            genElement(node, context);
            break;
        case 5 /* NodeTypes.COMPOUND_EXPRESSION */:
            genCompoundExpression(node, context);
            break;
    }
}
// 前导字符串拼接【此处的 preamble 即为 import 语句】
function generateModulePreamble(ast, context) {
    const { push } = context;
    const VueBinging = 'Vue';
    const aliaHelper = (s) => `${helperMapName[s]}: _${helperMapName[s]}`;
    if (ast.helpers.length > 0) {
        push(`const { ${ast.helpers.map(aliaHelper).join(', ')} } = ${VueBinging}\n`);
    }
    push('return ');
}
function genText(node, context) {
    const { push } = context;
    push(`'${node.content}'`);
}
function genInterpolation(node, context) {
    const { push, helper } = context;
    push(`${helper(TO_DISPLAY_STRING)}(`);
    genNode(node.content, context);
    push(')');
}
function genExpression(node, context) {
    const { push } = context;
    push(`${node.content}`);
}
function genElement(node, context) {
    const { push, helper } = context;
    const { tag = null, children = null, props = null } = node;
    push(`${helper(CREATE_ELEMENT_VNODE)}('${tag}', ${props}, `);
    genNode(children, context);
    push(')');
}
function genCompoundExpression(node, context) {
    const { push } = context;
    const { children } = node;
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (isString(child)) {
            push(child);
        }
        else {
            genNode(child, context);
        }
    }
}

function baseParse(content) {
    const context = createParserContext(content);
    return createRoot(parseChildren(context, []));
}
// 创建 paserContext
function createParserContext(content) {
    return {
        source: content,
    };
}
function parseChildren(context, ancestors) {
    const nodes = [];
    while (!isEnd(context, ancestors)) {
        let node;
        const s = context.source;
        if (startsWith(s, '{{')) {
            // 看看如果是 {{ 开头的话，那么就是一个插值， 那么去解析他
            node = parseInterpolation(context);
        }
        else if (s[0] === '<') {
            // https://html.spec.whatwg.org/multipage/parsing.html#tag-open-state
            /**
             * 正常情况来说还需要处理 html 的注释标签匹配 ———— <!-- -->
             * https://html.spec.whatwg.org/multipage/parsing.html#markup-declaration-open-state
            */
            if (s[1] === '/') {
                // 这里属于 edge case 可以不用关心
                // 处理结束标签
                if (/[a-z]/i.test(s[2])) {
                    // 匹配 </div>
                    // 需要改变 context.source 的值 -> 也就是需要移动光标
                    parseTag(context, 1 /* TagType.END */);
                    // 结束标签就以为这都已经处理完了，所以就可以跳出本次循环了
                    continue;
                }
            }
            else if (/[a-z]/i.test(s[1])) {
                node = parseElement(context, ancestors);
            }
        }
        if (!node) {
            node = parseText(context);
        }
        nodes.push(node);
    }
    return nodes;
}
function isEnd(context, ancestors) {
    // 检测标签的节点
    // 如果是结束标签的话，需要看看之前有没有开始标签，如果有的话，那么也应该结束
    // 这里的一个 edge case 是 <div><span></div>
    // 像这种情况下，其实就应该报错
    const s = context.source;
    if (context.source.startsWith('</')) {
        // 从后面往前面查
        // 因为便签如果存在的话 应该是 ancestors 最后一个元素
        for (let i = ancestors.length - 1; i >= 0; --i) {
            if (startsWithEndTagOpen(s, ancestors[i].tag)) {
                return true;
            }
        }
    }
    // 看看 context.source 还有没有值
    return !context.source;
}
function parseElement(context, ancestors) {
    // 应该如何解析 tag 呢
    // <div></div>
    // 先解析开始 tag
    const element = parseTag(context, 0 /* TagType.START */);
    ancestors.push(element); // 入栈
    const children = parseChildren(context, ancestors);
    ancestors.pop(); // 出栈
    // 解析 END tag 是为了检测语法是不是正确的
    // 检测是不是和 START tag 一致
    if (startsWithEndTagOpen(context.source, element.tag)) {
        parseTag(context, 1 /* TagType.END */);
    }
    else {
        throw new Error(`缺少结束标签：${element.tag}`);
    }
    element.children = children;
    return element;
}
function startsWithEndTagOpen(source, tag) {
    // 1. 头部 是不是以  </ 开头的
    // 2. 看看是不是和 tag 一样
    return (startsWith(source, '</') &&
        source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase());
}
function parseTag(context, type) {
    // 发现如果不是 > 的话，那么就把字符都收集起来 ->div
    // 正则
    const match = /^<\/?([a-z][^\r\n\t\f />]*)/i.exec(context.source);
    const tag = match[1];
    // 移动光标
    // <div
    advanceBy(context, match[0].length);
    // 暂时不处理 selfClose 标签的情况 ，所以可以直接 advanceBy 1个坐标 <  的下一个就是 >
    advanceBy(context, 1);
    if (type === 1 /* TagType.END */)
        return;
    let tagType = 0 /* ElementTypes.ELEMENT */;
    return {
        type: 4 /* NodeTypes.ELEMENT */,
        tag,
        tagType,
    };
}
function parseInterpolation(context) {
    // 1. 先获取到结束的index
    // 2. 通过 closeIndex - startIndex 获取到内容的长度 contextLength
    // 3. 通过 slice 截取内容
    // }} 是插值的关闭
    // 优化点是从 {{ 后面搜索即可
    const openDelimiter = '{{';
    const closeDelimiter = '}}';
    const closeIndex = context.source.indexOf(closeDelimiter, openDelimiter.length);
    // TODO closeIndex -1 需要报错的
    // 让代码前进2个长度，可以把 {{ 干掉
    advanceBy(context, 2);
    const rawContentLength = closeIndex - openDelimiter.length;
    const rawContent = context.source.slice(0, rawContentLength);
    const preTrimContent = parseTextData(context, rawContent.length);
    const content = preTrimContent.trim();
    // 最后在让代码前进2个长度，可以把 }} 干掉
    advanceBy(context, closeDelimiter.length);
    return {
        type: 2 /* NodeTypes.INTERPOLATION */,
        content: {
            type: 3 /* NodeTypes.SIMPLE_EXPRESSION */,
            content,
        },
    };
}
function parseText(context) {
    // endIndex 应该看看有没有对应的 <
    // 比如 hello</div>
    // 像这种情况下 endIndex 就应该是在 o 这里
    // {
    const endTokens = ['<', '{{'];
    let endIndex = context.source.length;
    for (let i = 0; i < endTokens.length; i++) {
        const index = context.source.indexOf(endTokens[i]);
        // endIndex > index 是需要要 endIndex 尽可能的小
        // 比如说：
        // hi, {{123}} <div></div>
        // 那么这里就应该停到 {{ 这里，而不是停到 <div 这里
        if (index !== -1 && endIndex > index) {
            endIndex = index;
        }
    }
    const content = parseTextData(context, endIndex);
    return {
        type: 0 /* NodeTypes.TEXT */,
        content,
    };
}
function parseTextData(context, length) {
    // 1. 直接返回 context.source
    // 从 length 切的话，是为了可以获取到 text 的值（需要用一个范围来确定）
    const rawText = context.source.slice(0, length);
    // 2. 移动光标
    advanceBy(context, length);
    return rawText;
}
function advanceBy(context, numberOfCharacters) {
    context.source = context.source.slice(numberOfCharacters);
}
function createRoot(children) {
    return {
        type: 1 /* NodeTypes.ROOT */,
        children,
        helpers: [],
    };
}
function startsWith(source, searchString) {
    return source.startsWith(searchString);
}

function transform(root, options = {}) {
    const context = createTransformContext(root, options);
    /**
     * 1. dfs
     * 2. 修改 text content
    */
    traversNode(root, context);
    createRootCodegen(root);
    root.helpers.push(...context.helpers.keys());
}
function createRootCodegen(root) {
    const [child] = root.children;
    if (child.type === 4 /* NodeTypes.ELEMENT */ && child.codegenNode) {
        root.codegenNode = child.codegenNode;
    }
    else {
        root.codegenNode = child;
    }
}
function createTransformContext(root, options) {
    const context = {
        root,
        nodeTransforms: options.nodeTransforms || [],
        helpers: new Map(),
        helper(key) {
            context.helpers.set(key, 1);
        },
    };
    return context;
}
function traversNode(node, context) {
    // element
    const { nodeTransforms } = context;
    const exitFuncs = [];
    for (const transform of nodeTransforms) {
        const onExit = transform(node, context);
        if (onExit) {
            exitFuncs.push(onExit);
        }
    }
    // 判断
    switch (node.type) {
        case 2 /* NodeTypes.INTERPOLATION */:
            context.helper(TO_DISPLAY_STRING);
            break;
        case 1 /* NodeTypes.ROOT */:
        case 4 /* NodeTypes.ELEMENT */:
            traversChildren(node, context);
            break;
    }
    /**
     * 防止部分 case 无法触及（前边已经轮询过去），通过 exitFuncs 缓存并随后先入后出的执行完毕
    */
    let i = exitFuncs.length;
    while (i--) {
        exitFuncs[i]();
    }
}
function traversChildren(parentNode, context) {
    const { children } = parentNode;
    for (const childNode of children) {
        traversNode(childNode, context);
    }
}

function createVNodeCall(context, tag, props, children) {
    if (context) {
        context.helper(CREATE_ELEMENT_VNODE);
    }
    return {
        // TODO vue3 里面这里的 type 是 VNODE_CALL
        // 是为了 block 而 mini-vue 里面没有实现 block 
        // 所以创建的是 Element 类型就够用了
        type: 4 /* NodeTypes.ELEMENT */,
        tag,
        props,
        children,
    };
}

function transformElement(node, context) {
    if (node.type === 4 /* NodeTypes.ELEMENT */) {
        return () => {
            context.helper(CREATE_ELEMENT_VNODE);
            // TODO 处理 props
            let vnodeProps;
            // TODO 处理 tag
            const { tag: vnodeTag } = node;
            // 处理 children
            const { children } = node;
            const [child] = children;
            let vnodeChildren = child;
            node.codegenNode = createVNodeCall(context, vnodeTag, vnodeProps, vnodeChildren);
        };
    }
}

function transformExpression(node) {
    if (node.type === 2 /* NodeTypes.INTERPOLATION */) {
        node.content = processExpression(node.content);
    }
}
function processExpression(node) {
    node.content = `_ctx.${node.content}`;
    return node;
}

const isText = (node) => node.type === 0 /* NodeTypes.TEXT */ || node.type === 2 /* NodeTypes.INTERPOLATION */;

function transformText(node) {
    let currentContainer;
    if (node.type === 4 /* NodeTypes.ELEMENT */) {
        return () => {
            const { children } = node;
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                if (isText(child)) {
                    for (let j = i + 1; j < children.length; j++) {
                        const next = children[j];
                        if (isText(next)) {
                            if (!currentContainer) {
                                currentContainer = children[i] = {
                                    type: 5 /* NodeTypes.COMPOUND_EXPRESSION */,
                                    children: [child],
                                };
                            }
                            currentContainer.children.push(' + ');
                            currentContainer.children.push(next);
                            children.splice(j, 1);
                            j--;
                        }
                    }
                }
            }
        };
    }
}

function baseCompile(template) {
    const ast = baseParse(template);
    console.log(ast);
    transform(ast, {
        nodeTransforms: [transformExpression, transformElement, transformText],
    });
    console.log('compiler ast = ', ast, ast.codegenNode.children);
    return generator(ast);
}

// self-vue3 出口
function compileToFunction(template) {
    const { code } = baseCompile(template);
    console.log('code = ', code);
    const render = new Function('Vue', code)(runtimeDom);
    return render;
}
registerRuntimeCompiler(compileToFunction);
/**
 * 最终编译完成后的结果格式如下
    function renderFunction(Vue) {
      const {
        toDisplayString: _toDisplayString,
        openBlock: _openBlock,
        creatElementBlock: _createElementBlock,
      } = Vue;

      return function render(_ctx, _cache, $props, $setup, $data, $options) {
        return (
          _openBlock(),
          _createElementBlock(
            'div',
            null,
            'hi, ' + _toDisplayString(_ctx.message),
            1
          )
        );
      };
    };
 *
*/

exports.createApp = createApp;
exports.createAppAPI = createAppAPI;
exports.createElement = createElement;
exports.createElementVNode = createVNode;
exports.createRenderer = createRenderer;
exports.createTextVNode = createTextVNode;
exports.getCurrentInstance = getCurrentInstance;
exports.h = h;
exports.inject = inject;
exports.insert = insert;
exports.nextTick = nextTick;
exports.patchProp = patchProp;
exports.provide = provide;
exports.proxyRefs = proxyRefs;
exports.ref = ref;
exports.registerRuntimeCompiler = registerRuntimeCompiler;
exports.remove = remove;
exports.renderSlots = renderSlots;
exports.setElementText = setElementText;
exports.toDisplayString = toDisplayString;
