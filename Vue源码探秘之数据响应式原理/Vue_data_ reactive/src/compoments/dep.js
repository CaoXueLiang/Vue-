/**
 * 依赖收集/收集订阅者
 */
let uid = 0;
export default class Dep {
  constructor() {
    this.subs = [];
    this.id = uid++;
  }

  //添加订阅
  addSub(sub) {
    this.subs.push(sub);
  }

  //收集依赖
  depend() {
    //Dep.target就是我们自己指定的全局变量，使用window.target也行，只要全局唯一就行
    if (Dep.target) {
      this.addSub(Dep.target);
    }
  }

  notify() {
    for (let i = 0, l = this.subs.length; i < l; i++) {
      this.subs[i].update();
    }
  }
}
