import { getCurrentInstance } from "./component";

export function provide(key: string, value) {
  const currentInstance: any = getCurrentInstance();

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
};

export function inject(key: string, defaultValue: string|Function) {
  const currentInstance: any = getCurrentInstance();

  if (currentInstance) {
    const parentProvides = currentInstance.parent.provides;
    if (key in parentProvides) {
      return parentProvides[key];
    } else if (defaultValue) {
      if (typeof defaultValue === 'function') return defaultValue();
      return defaultValue;
    }
  }
};
