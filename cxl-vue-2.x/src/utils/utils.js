export function def(obj, key, value) {
  Object.defineProperty(obj, key, {
    enumerable: false,
    configurable: true,
    writable: true,
    value: value,
  });
}
