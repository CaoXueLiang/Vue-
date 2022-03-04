/*
 * 定义拦截器，用于拦截数组的操作
 * 对数组的 push，pop，shift，unshift，splice，sort，reverse 7个方法进行拦截
 */

import { def } from "../util/index";

// 获取数组的原型方法
const arrayProto = Array.prototype;
// 通过继承的方式创建新的 arrayMethods，已第一个参数为原型创建新的对象
export const arrayMethods = Object.create(arrayProto);

// 可以改变数组本身的 7 个方法
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
 * 拦截变异方法，并触发事件
 */
methodsToPatch.forEach(function (method) {
  // 缓存原生方法，比如原生的 push,pop,shift,unshift,splice,sort,reverse
  const original = arrayProto[method];
  // 拦截数组方法的访问
  def(arrayMethods, method, function mutator(...args) {
    // 先执行原生方法
    const result = original.apply(this, args);
    const ob = this.__ob__;
    let inserted;

    //如果方法是以下三个之一，说明是插入了元素
    switch (method) {
      case "push":
      case "unshift":
        inserted = args;
        break;
      case "splice":
        inserted = args.slice(2);
        break;
    }
    // 对插入的元素做响应式处理
    if (inserted) ob.observeArray(inserted);
    // 通知更新
    ob.dep.notify();
    return result;
  });
});
