/* @flow */

import {
  warn,
  remove,
  isObject,
  parsePath,
  _Set as Set,
  handleError,
  invokeWithErrorHandling,
  noop,
} from "../util/index";

import { traverse } from "./traverse";
import { queueWatcher } from "./scheduler";
import Dep, { pushTarget, popTarget } from "./dep";

import type { SimpleSet } from "../util/index";

let uid = 0;

/**
 * 一个组件一个 watcher (渲染watcher) 或者一个表达式一个 watcher (用户watcher)
 * 当数据更新时，watcher 会被触发，访问this.computedProperty 时也会触发 watcher
 */
export default class Watcher {
  vm: Component;
  expression: string;
  cb: Function;
  id: number;
  deep: boolean;
  user: boolean;
  lazy: boolean;
  sync: boolean;
  dirty: boolean;
  active: boolean;
  deps: Array<Dep>;
  newDeps: Array<Dep>;
  depIds: SimpleSet;
  newDepIds: SimpleSet;
  before: ?Function;
  getter: Function;
  value: any;

  constructor(
    vm: Component,
    expOrFn: string | Function,
    cb: Function,
    options?: ?Object,
    isRenderWatcher?: boolean
  ) {
    this.vm = vm;
    if (isRenderWatcher) {
      vm._watcher = this;
    }
    vm._watchers.push(this);
    // options
    if (options) {
      this.deep = !!options.deep;
      this.user = !!options.user;
      this.lazy = !!options.lazy;
      this.sync = !!options.sync;
      this.before = options.before;
    } else {
      this.deep = this.user = this.lazy = this.sync = false;
    }
    this.cb = cb;
    this.id = ++uid; // uid for batching
    this.active = true;
    this.dirty = this.lazy; // for lazy watchers
    this.deps = [];
    this.newDeps = [];
    this.depIds = new Set();
    this.newDepIds = new Set();
    this.expression =
      process.env.NODE_ENV !== "production" ? expOrFn.toString() : "";
    // parse expression for getter
    if (typeof expOrFn === "function") {
      this.getter = expOrFn;
    } else {
      // 在`this.get`中执行 this.getter 时会触发依赖收集
      this.getter = parsePath(expOrFn);
      if (!this.getter) {
        this.getter = noop;
        process.env.NODE_ENV !== "production" &&
          warn(
            `Failed watching path: "${expOrFn}" ` +
              "Watcher only accepts simple dot-delimited paths. " +
              "For full control, use a function instead.",
            vm
          );
      }
    }
    this.value = this.lazy ? undefined : this.get();
  }

  /**
   * 执行 this.getter,并重新收集依赖
   * this.getter 是实例化`watcher`时传递的第二个参数，一个函数或者字符串，比如：updateComputed或者 parsePath返回的函数
   * 为什么要重新收集依赖？
   *  因为触发更新说明有响应式数据被更新了，虽然被更新的数据虽然已经经过 observe 观察了，但是却没有进行依赖收集
   *  所以，在更新页面时，会重新执行一次 render 函数，执行期间会触发读取操作，这时候进行依赖收集
   */
  get() {
    pushTarget(this);
    let value;
    const vm = this.vm;
    try {
      //执行回调函数，比如updateComputed， 进入patch阶段
      value = this.getter.call(vm, vm);
    } catch (e) {
      if (this.user) {
        handleError(e, vm, `getter for watcher "${this.expression}"`);
      } else {
        throw e;
      }
    } finally {
      // "touch" every property so they are all tracked as
      // dependencies for deep watching
      if (this.deep) {
        traverse(value);
      }
      popTarget();
      this.cleanupDeps();
    }
    return value;
  }

  /**
   * 做了两件事：1.添加dep到watcher 2.添加wathcer到dep。watcher和dep相互添加
   */
  addDep(dep: Dep) {
    const id = dep.id;
    if (!this.newDepIds.has(id)) {
      this.newDepIds.add(id);
      this.newDeps.push(dep);
      if (!this.depIds.has(id)) {
        dep.addSub(this);
      }
    }
  }

  /**
   * Clean up for dependency collection.
   */
  cleanupDeps() {
    let i = this.deps.length;
    while (i--) {
      const dep = this.deps[i];
      if (!this.newDepIds.has(dep.id)) {
        dep.removeSub(this);
      }
    }
    let tmp = this.depIds;
    this.depIds = this.newDepIds;
    this.newDepIds = tmp;
    this.newDepIds.clear();
    tmp = this.deps;
    this.deps = this.newDeps;
    this.newDeps = tmp;
    this.newDeps.length = 0;
  }

  /**
   * 根据 watcher 配置项，决定接下来怎么走，一般是 queueWatcher.
   */
  update() {
    if (this.lazy) {
      // 懒加载时走这里，比如 computed
      // 将 dirty 设置为 true，可以让 computedGetter 执行时重新计算 computed 回调函数的执行结果
      this.dirty = true;
    } else if (this.sync) {
      // 同步执行，在使用 vm.$watch 或者 watch 选项时可以传一个sync选项
      // 当为true时，数据更新时，该watcher就不走异步更新队列，直接执行 this.run
      this.run();
    } else {
      // 更新时一般都走这里，将watcher放到watcher队列
      queueWatcher(this);
    }
  }

  /**
   * 由 刷新队列函数 flushSchedulerQueue 调用，如果是同步 watch，则由 this.update 直接调用，完成如下几件事：
   * 1. 执行实例化 watcher 传递的第二个参数，updteComponent 或者 获取 this.xx 的一个函数（parsePath 返回的函数）
   * 2. 更新旧值为新值
   * 3. 执行实例化 watcher 时传递的第三个参数，比如用户 watcher 的回调函数
   */
  run() {
    if (this.active) {
      const value = this.get();
      if (
        value !== this.value ||
        // Deep watchers and watchers on Object/Arrays should fire even
        // when the value is the same, because the value may
        // have mutated.
        isObject(value) ||
        this.deep
      ) {
        // set new value
        const oldValue = this.value;
        this.value = value;
        if (this.user) {
          //如果是用户watcher,则执行用户传递的第三个参数---回调函数，参数为val和oldVal
          const info = `callback for watcher "${this.expression}"`;
          invokeWithErrorHandling(
            this.cb,
            this.vm,
            [value, oldValue],
            this.vm,
            info
          );
        } else {
          //渲染watcher,this.cb = noop, noop是一个空函数。
          this.cb.call(this.vm, value, oldValue);
        }
      }
    }
  }

  /**
   * 懒执行的 watcher 会调用该方法 （computed 实现缓存的原理）
   * Evaluate the value of the watcher.
   * This only gets called for lazy watchers.
   */
  evaluate() {
    this.value = this.get();
    this.dirty = false;
  }

  /**
   * Depend on all deps collected by this watcher.
   */
  depend() {
    let i = this.deps.length;
    while (i--) {
      this.deps[i].depend();
    }
  }

  /**
   * 将 自身 从依赖列表中删除
   * Remove self from all dependencies' subscriber list.
   */
  teardown() {
    if (this.active) {
      // remove self from vm's watcher list
      // this is a somewhat expensive operation so we skip it
      // if the vm is being destroyed.
      if (!this.vm._isBeingDestroyed) {
        remove(this.vm._watchers, this);
      }
      let i = this.deps.length;
      while (i--) {
        this.deps[i].removeSub(this);
      }
      this.active = false;
    }
  }
}
