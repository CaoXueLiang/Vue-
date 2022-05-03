/**
 * 将 key 代理到 target 上
 * 比如：访问 this.xx 等同于访问 this._data.xx
 * @param {*} target  目标对象 比如:vm
 * @param {*} sourceKey 原始key,比如:_data
 * @param {*} key 代理原始对象上的指定属性
 */
export function proxy(target, sourceKey, key) {
  Object.defineProperty(target, key, {
    get() {
      return target[sourceKey][key];
    },
    set(newVal) {
      target[sourceKey][key] = newVal;
    },
  });
}

/**
 * 为对象上定义属性，并且是不可枚举类型
 * @param {*} target
 * @param {*} key
 * @param {*} value
 */
export function def(target, key, value) {
  Object.defineProperty(target, key, {
    value: value,
    enumerable: false,
    configurable: true,
    writable: true,
  });
}
