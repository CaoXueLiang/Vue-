import { def } from "./utils";

const arrayproto = Array.prototype;
export const arrayMethods = Object.create(arrayproto);

const methodsToPatch = [
  "push",
  "pop",
  "shift",
  "unshift",
  "splice",
  "sort",
  "reverse",
];

/**
 * 拦截变异方法并触发事件
 */
methodsToPatch.forEach(function (method) {
  //缓存的原方法
  const original = arrayproto[method];
  def(arrayMethods, method, function mutator(...args) {
    const result = original.apply(this, args);

    console.log(`-----监听数组的变化----${method}----${args}`);
    const ob = this.__ob__;
    let inserted; //记录插入的元素，对插入的元素也要添加`Observe`
    if (method === "push" || method === "unshift") {
      inserted = args;
    }
    if (method === "splice") {
      inserted = args.slice(2);
    }
    if (inserted) {
      ob.observeArray(inserted);
    }
    //通知改变
    ob.dep.notify();
    return result;
  });
});
