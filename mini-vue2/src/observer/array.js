/**
 * 对于数组的监听则通过拦截数组的七个方法来实现
 */

// 数组的默认原型对象
const arrayProto = Array.prototype;
// 以数组的默认原型对象为原型创建一个新的对象
const arrayMethods = Object.create(arrayProto);
// 为什么是这七个方法？因为只有这七个方法是能更改数组本身的，像 concat 这些方法都会返回一个新的数组，不会改变数组本身
const methodsToPatch = [
  "push",
  "pop",
  "shift",
  "unshift",
  "splice",
  "sort",
  "reverse",
];

methodsToPatch.forEach((method) => {
  // 获取原始的方法
  const original = arrayProto[method];
  Object.defineProperty(arrayMethods, method, {
    configurable: true,
    enumerable: true,
    writable: true,
    value: function (...args) {
      const res = original.apply(this, args);
      console.log("array defineReactive", args);
      // 新增元素列表
      let inserted = [];
      if (method === "push") {
        inserted = args;
      } else if (method === "unshift") {
        inserted = args;
      } else if (method === "splice") {
        inserted = args.slice(2);
      }
      // 如果数组有新增的元素，则对新增的元素也进行响应式处理
      inserted.length && this.__ob__.observeArray(inserted);
      // 依赖通知更新
      this.__ob__.dep.notify();
      return res;
    },
  });
});

/**
 * 覆盖数组的原型对象
 */
export default function protoArgument(arr) {
  arr.__proto__ = arrayMethods;
}
