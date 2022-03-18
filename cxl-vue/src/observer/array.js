import { def } from "../utils/utils";
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
    ob.observeArray(inserted);
    return result;
  });
});
