import Dep from "./dep.js";

/**
 * Watcher 数据发生变化后，cb进行回调
 */
export default class Watcher {
  constructor(cb) {
    this._cb = cb;
    Dep.target = this;
    cb();
    Dep.target = null;
  }

  // 响应式数据更新时，会通知`Watcher`执行update方法
  update() {
    this._cb();
  }
}
