import { def } from "../utils/utils.js";
const arrayProto = Array.prototype;
// 以`arrayProto`为原型创建一个新对象
export const arrayMethods = Object.create(arrayProto);

const methodToPatch = [
  "push",
  "pop",
  "shift",
  "unshift",
  "splice",
  "sort",
  "reverse",
];

methodToPatch.forEach(function (method) {
  const original = arrayProto[method];
  def(arrayMethods, method, function (...args) {
    let result = original.apply(this, args);
    const ob = this.__ob__;
    let inserted;

    if (method === "push" || method === "unshift") {
      inserted = args;
    } else if (method === "splice") {
      inserted = args.splice(2);
    }
    // 如果有新增元素，则对新增的元素也进行响应式处理
    ob.observeArray(inserted);
    // 发送通知
    ob.dep.notify();
    return result;
  });
});
