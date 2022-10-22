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

export const PublicInstanceProxyHandlers = {
  get({ _: instance }, key) {
    const { setupState } = instance;
    if (key in setupState) return setupState[key];


    const publicPropertyGetter = publicPropertiesMap[key];
    if (publicPropertyGetter) return publicPropertyGetter(instance);
  },
};