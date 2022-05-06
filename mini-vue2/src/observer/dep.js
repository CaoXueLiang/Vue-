export default class Dep {
  constructor() {
    // 存储当前dep实例收集的所有 watcher
    this.watchers = [];
    // Dep.target 是一个静态属性，值为 null 或者 watcher实例
    // 在实例化 Watcher 时进行赋值，待依赖收集完成后在 Watcher 中又重新赋值为 null
    Dep.target = null;
  }

  // 收集watcher
  depend() {
    if (this.watchers.includes(Dep.target)) {
      return;
    }
    this.watchers.push(Dep.target);
  }

  // dep通知自己收集的所有 watcher 执行更新
  notify() {
    for (let index = 0; index < this.watchers.length; index++) {
      const watcher = this.watchers[index];
      watcher.update();
    }
  }
}

/**
 * 存储所有的Dep.target
 * 为什么会有多个 Dep.target?
 * 组件会产生一个渲染watcher, 在渲染过程中如果处理到用户watcher
 * 比如 computed计算属性，这时候会执行 evalute --> get
 * 假设直接赋值 Dep.target, 那Dep.target 的上一个值 --渲染watcher就会丢失
 * 造成在 computed 计算属性之后渲染的响应式数据无法完成依赖收集
 */
const targetStack = [];

/**
 * 备份本次传递进来的watcher,并将其赋值给 Dep.target
 * @param {*} target watcher实例
 */
export function pushTarget(target) {
  targetStack.push(target);
  Dep.target = target;
}

/**
 * 将 Dep.target 重置为上一个 watcher或者null
 */
export function popTarget() {
  targetStack.pop();
  Dep.target = targetStack[targetStack.length - 1];
}
