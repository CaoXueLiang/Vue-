/**
 * 判断是否是对象
 */
export function isObject(value) {
  return value !== null && typeof value === "object";
}

/**
 * 判断对象是否有某个属性
 */
export function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

/**
 * 为对象设置属性
 */
export function def(obj, key, val, enumerable) {
  Object.defineProperty(obj, key, {
    value: val,
    configurable: true,
    enumerable: enumerable !== undefined ? enumerable : true,
    writable: true,
  });
}
