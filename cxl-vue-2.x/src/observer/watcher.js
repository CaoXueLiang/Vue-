import Dep from "./dep.js";
import { pushTarget, popTarget } from "./dep.js";
import { queueWatcher } from "../asyncUpdateQueue.js";

// 给每个Watcher设置一个唯一标识id
let uid = 0;

/**
 * Watcher 数据发生变化后，cb进行回调
 */
export default class Watcher {
  constructor(cb, options = {}, vm = null) {
    this.uid = uid++;
    //保存回调函数
    this._cb = cb;
    //回调函数执行后的值
    this.value = null;
    // computed 计算属性实现缓存的原理
    this.dirty = !!options.lazy;
    this.lazy = !!options.lazy;
    this.vm = vm;
    //非懒执行时，直接执行 cb 函数，cb函数中会发生 vm.xx 的属性读取，从而进行依赖收集
    !options.lazy && this.get();
  }

  /**
   * 响应式数据更新时，会通知`Watcher`执行update方法
   * 让 update 方法执行this._cb函数更新DOM
   */
  update() {
    if (this.lazy) {
      //懒加载，比如computed计算属性
      //将dirty设置为true,当页面重新渲染获取计算属性时，就可以执行 evalute 方法获取最新的值了
      this.dirty = true;
    } else {
      //将watcher放入异步watcher队列
      queueWatcher(this);
    }
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

  /**
   * 由刷新 watcher 队列的函数调用，负责执行watcher.get方法
   */
  run() {
    this.get();
  }
}
