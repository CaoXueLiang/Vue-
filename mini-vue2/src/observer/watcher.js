import { pushTarget, popTarget } from "./dep.js";
import queueWatcher from "./scheduler.js";

// 用来标记watcher,为每个watcher设置uid
let uid = 0;
export default class Watcher {
  constructor(cb, options = {}, vm = null) {
    this.uid = uid++;
    this._cb = cb;
    this.value = null;
    this.dirty = !!options.lazy;
    this.options = options;
    this.vm = vm;
    // 非懒执行时，直接执行cb函数，cb函数会发生 vm.xx属性的读取，从而进行依赖收集
    !options.lazy && this.get();
  }

  /**
   * 响应式数据更新时，dep通知watcher执行update方法
   * 让 update方法执行 this._cb 函数（也就是updateComponent回调）
   */
  update() {
    if (this.options.lazy) {
      // 懒加载比如:computed计算属性
      // 将dirty置为true, 当页面重新渲染获取计算属性时就可以执行evalute方法获取最新的值了
      this.dirty = true;
    } else {
      // 将watcher放到watcher队列
      queueWatcher(this);
    }
  }

  /**
   * 执行get方法，用于实现computed
   */
  evalute() {
    // 执行get,触发计算函数的执行
    this.get();
    // 将dirty设置为false, 实现一次刷新周期内 computed实现缓存
    this.dirty = false;
  }

  /**
   * 负责执行watcher的回调函数
   * 执行时进行依赖收集
   */
  get() {
    pushTarget(this);
    this.value = this._cb.apply(this.vm);
    popTarget();
  }

  /**
   * 由刷新watcher队列的函数（flushSchedulerQueue）调用
   * 负责执行 watcher.get 方法
   */
  run() {
    this.get();
  }
}
