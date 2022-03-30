import Dep from "./dep.js";
import { pushTarget, popTarget } from "./dep.js";

/**
 * Watcher 数据发生变化后，cb进行回调
 */
export default class Watcher {
  constructor(cb, options = {}, vm = null) {
    //保存回调函数
    this._cb = cb;
    //回调函数执行后的值
    this.value = null;
    // computed 计算属性实现缓存的原理
    this.dirty = !!options.lazy;
    this.vm = vm;
    //非懒执行时，直接执行 cb 函数，cb函数中会发生 vm.xx 的属性读取，从而进行依赖收集
    !options.lazy && this.get();
  }

  /**
   * 响应式数据更新时，会通知`Watcher`执行update方法
   * 让 update 方法执行this._cb函数更新DOM
   */
  update() {
    Promise.resolve().then(() => {
      this._cb();
    });
    //执行完_cb函数，DOM更新完毕，进入下一个渲染周期。所以将dirty置为true
    //当再次获取计算属性时，就可以执行evalute方法获取最新的值了
    this.dirty = true;
  }

  /**
   * 负责执行 Watcher 的回调函数。
   * 执行时进行依赖收集
   */
  get() {
    pushTarget(this);
    this.value = this._cb.apply(this.vm);
    popTarget();
  }

  evalute() {
    // 重新获取value的值
    this.get();
    // 将dirty设置为false, 实现依次刷新周期内 computed的缓存
    this.dirty = false;
  }
}
