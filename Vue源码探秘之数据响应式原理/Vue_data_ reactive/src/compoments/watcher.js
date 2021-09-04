import Dep from "./dep";

var uid = 0;
export default class Watcher {
  constructor(target, express, callback) {
    this.id = uid++;
    this.target = target;
    this.express = express;
    this.callback = callback;
    this.value = this.get();
  }

  update() {
    //当前对象,newValue,oldValue
    this.callback(
      this.target,
      this.parsePath(this.target, this.express),
      this.value
    );
  }

  get() {
    //进入依赖收集阶段，让全局的Dep.targer设置为这个watcher实例，进入依赖收集阶段
    Dep.target = this;
    let resultValue = this.parsePath(this.target, this.express); //触发`DefineProperty`get方法，触发依赖收集
    Dep.target = null;
    return resultValue;
  }

  parsePath(target, str) {
    let strArray = str.split(".");
    let result = strArray.reduce((pre, key) => {
      return pre[key];
    }, target);
    return result;
  }
}
