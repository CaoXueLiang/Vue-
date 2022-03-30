export default class Dep {
  constructor() {
    this.watchers = [];
    Dep.target = null;
  }

  depend() {
    if (!this.watchers.includes(Dep.target)) {
      this.watchers.push(Dep.target);
    }
  }

  notify() {
    for (const watcher of this.watchers) {
      watcher.update();
    }
  }
}

/**
 * 存储所有的 Dep.target
 * 为什么会有多个Dep.target?
 * 组件会产生一个渲染Watcher，在渲染过程中如果处理到用户Watcher,
 * 比如：computed计算属性，这时就会执行 evalute -> get
 * 假如直接赋值 Dep.target, 那Dep.target的上一值 --渲染Watcher就会丢失
 * 造成 computed 计算属性之后渲染的响应式数据无法完成依赖收集
 */
const targetStack = [];

/**
 * 备份本次传递进来的Watcher,并将其赋值给 Dep.target
 * @param {*} target watcher实例
 */
export function pushTarget(target) {
  Dep.target = target;
  targetStack.push(target);
}

/**
 * 将Dep.target重置为上一个Watcher或者null
 */
export function popTarget() {
  targetStack.pop();
  Dep.target = targetStack[targetStack.length - 1];
}
