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
