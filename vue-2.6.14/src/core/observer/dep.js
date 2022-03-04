/* @flow */

import type Watcher from "./watcher";
import { remove } from "../util/index";
import config from "../config";

let uid = 0;

/**
 * 一个dep,对应一个object.key
 * 在读取响应式数据时，负责收集依赖，每个dep（或者说obj.key）依赖的watcher有哪些
 * 在响应式数据更新时，负责通知dep中哪些watcher去执行 update方法
 */
export default class Dep {
  static target: ?Watcher;
  id: number;
  subs: Array<Watcher>;

  constructor() {
    this.id = uid++;
    this.subs = [];
  }

  //在 dep 中添加 watcher
  addSub(sub: Watcher) {
    this.subs.push(sub);
  }

  removeSub(sub: Watcher) {
    remove(this.subs, sub);
  }

  //将dep添加到watcher中
  depend() {
    if (Dep.target) {
      Dep.target.addDep(this);
    }
  }

  // 通知dep中的所有watcher,执行watcher.update方法
  notify() {
    // stabilize the subscriber list first
    const subs = this.subs.slice();
    if (process.env.NODE_ENV !== "production" && !config.async) {
      // subs aren't sorted in scheduler if not running async
      // we need to sort them now to make sure they fire in correct
      // order
      subs.sort((a, b) => a.id - b.id);
    }
    for (let i = 0, l = subs.length; i < l; i++) {
      subs[i].update();
    }
  }
}

/**
 * 当前正在执行的 watcher,同一时间只有一个watcher在执行
 * Dep.target = 当前正在执行的watcher
 * 通过pushTarget方法完成赋值，通过popTarget方法完成重置
 */
Dep.target = null;
const targetStack = [];

export function pushTarget(target: ?Watcher) {
  targetStack.push(target);
  Dep.target = target;
}

export function popTarget() {
  targetStack.pop();
  Dep.target = targetStack[targetStack.length - 1];
}
