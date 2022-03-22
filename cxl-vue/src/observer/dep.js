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
