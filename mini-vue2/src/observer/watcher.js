import Dep from "./dep.js";

export default class Watcher {
  constructor(cb) {
    this._cb = cb;
    Dep.target = this;
    // 执行 cb 函数，cb函数中会发生 vm.xx 的属性读取，进行依赖收集
    cb();
    Dep.target = null;
  }

  update() {
    this._cb();
  }
}
