/* @flow */

import type Watcher from "./watcher";
import config from "../config";
import { callHook, activateChildComponent } from "../instance/lifecycle";

import { warn, nextTick, devtools, inBrowser, isIE } from "../util/index";

export const MAX_UPDATE_COUNT = 100;

const queue: Array<Watcher> = [];
const activatedChildren: Array<Component> = [];
let has: { [key: number]: ?true } = {};
let circular: { [key: number]: number } = {};
let waiting = false;
let flushing = false;
let index = 0;

/**
 * Reset the scheduler's state.
 */
function resetSchedulerState() {
  index = queue.length = activatedChildren.length = 0;
  has = {};
  if (process.env.NODE_ENV !== "production") {
    circular = {};
  }
  waiting = flushing = false;
}

// Async edge case #6566 requires saving the timestamp when event listeners are
// attached. However, calling performance.now() has a perf overhead especially
// if the page has thousands of event listeners. Instead, we take a timestamp
// every time the scheduler flushes and use that for all event listeners
// attached during that flush.
export let currentFlushTimestamp = 0;

// Async edge case fix requires storing an event listener's attach timestamp.
let getNow: () => number = Date.now;

// Determine what event timestamp the browser is using. Annoyingly, the
// timestamp can either be hi-res (relative to page load) or low-res
// (relative to UNIX epoch), so in order to compare time we have to use the
// same timestamp type when saving the flush timestamp.
// All IE versions use low-res event timestamps, and have problematic clock
// implementations (#9632)
if (inBrowser && !isIE) {
  const performance = window.performance;
  if (
    performance &&
    typeof performance.now === "function" &&
    getNow() > document.createEvent("Event").timeStamp
  ) {
    // if the event timestamp, although evaluated AFTER the Date.now(), is
    // smaller than it, it means the event is using a hi-res timestamp,
    // and we need to use the hi-res version for event listener timestamps as
    // well.
    getNow = () => performance.now();
  }
}

/**
 * Flush both queues and run the watchers.
 * 刷新 watcher 队列的函数，由flushCallbacks函数负责调用
 * 主要做了两件事：
 * 1. 更新flushing为true，表示正在刷新队列，在此期间往队列中 push 新的 watcher时需要特殊处理（将其放到队列的合适位置）
 * 2. 按照队列中 watcher.id 从小到大排序，保证先创建的watcher先执行
 * 3. 遍历 watcher 队列，依次执行 watcher.before、watcher.run
 */
function flushSchedulerQueue() {
  // console.log("----flushSchedulerQueue---", queue);
  currentFlushTimestamp = getNow();
  //标识现在正在刷新watcher队列
  flushing = true;
  let watcher, id;

  // Sort queue before flush.
  // This ensures that:
  // 1. Components are updated from parent to child. (because parent is always
  //    created before the child)
  // 2. A component's user watchers are run before its render watcher (because
  //    user watchers are created before the render watcher)
  // 3. If a component is destroyed during a parent component's watcher run,
  //    its watchers can be skipped.
  /**
   * 刷新队列之前先给队列排序，可以保证：
   * 1. 组件的更新顺序为从父级到子级（因为父组件总是在子组件之前创建）
   * 2. 一个组件的用户`watcher`在其渲染`watcher `之前被执行。（因为用户watcher先于渲染watcher创建）
   * 3. 如果一个组件在其父组件的watcher.run 执行期间被销毁，则它的watcher可以被跳过
   * 排序以后在刷新队列期间新进来的watcher也会按顺序放入队列的合适位置
   */
  queue.sort((a, b) => a.id - b.id);

  // do not cache length because more watchers might be pushed
  // as we run existing watchers
  // 这里直接使用了 queue.length, 动态计算队列的长度没有缓存长度，这是因为执行现有watcher期间队列中可能会被push进来新的watcher
  for (index = 0; index < queue.length; index++) {
    watcher = queue[index];
    // 执行 before 钩子，在执行 vm.$watch 或者 watch 选项时可以通过配置项(options.before)传递
    if (watcher.before) {
      watcher.before();
    }
    id = watcher.id;
    has[id] = null;
    // 执行watcher.run,最终触发更新函数，如比 updateComponent
    watcher.run();
    // in dev build, check and stop circular updates.
    if (process.env.NODE_ENV !== "production" && has[id] != null) {
      circular[id] = (circular[id] || 0) + 1;
      if (circular[id] > MAX_UPDATE_COUNT) {
        warn(
          "You may have an infinite update loop " +
            (watcher.user
              ? `in watcher with expression "${watcher.expression}"`
              : `in a component render function.`),
          watcher.vm
        );
        break;
      }
    }
  }

  // keep copies of post queues before resetting state
  const activatedQueue = activatedChildren.slice();
  const updatedQueue = queue.slice();

  /**
   * 重置调度状态：
   * 1、重置 has 缓存对象，has = {}
   * 2、waiting = flushing = false，表示刷新队列结束
   * 表示可以像 callbacks 数组中放入新的 flushSchedulerQueue 函数，并且可以向浏览器的任务队列放入下一个 flushCallbacks 函数了
   */
  resetSchedulerState();

  // call component updated and activated hooks
  callActivatedHooks(activatedQueue);
  callUpdatedHooks(updatedQueue);

  // devtool hook
  /* istanbul ignore if */
  if (devtools && config.devtools) {
    devtools.emit("flush");
  }
}

function callUpdatedHooks(queue) {
  let i = queue.length;
  while (i--) {
    const watcher = queue[i];
    const vm = watcher.vm;
    if (vm._watcher === watcher && vm._isMounted && !vm._isDestroyed) {
      callHook(vm, "updated");
    }
  }
}

/**
 * Queue a kept-alive component that was activated during patch.
 * The queue will be processed after the entire tree has been patched.
 */
export function queueActivatedComponent(vm: Component) {
  // setting _inactive to false here so that a render function can
  // rely on checking whether it's in an inactive tree (e.g. router-view)
  vm._inactive = false;
  activatedChildren.push(vm);
}

function callActivatedHooks(queue) {
  for (let i = 0; i < queue.length; i++) {
    queue[i]._inactive = true;
    activateChildComponent(queue[i], true /* true */);
  }
}

/**
 * 将 watcher加入到 watcher 队列
 */
export function queueWatcher(watcher: Watcher) {
  const id = watcher.id;
  // 如果 watcher 已经存在则跳过，不会重复入队
  // ❗同一个watcher，如果watcher.id相同，则不会重复入队
  if (has[id] == null) {
    has[id] = true;
    if (!flushing) {
      // 当前没有处于刷新watcher队列状态，watcher 直接入队
      queue.push(watcher);
    } else {
      // 已经在刷新队列了
      // 从队列末尾开始倒叙遍历，根据当前 watcher.id 找到它大于的 watcher.id 的位置，然后将自己插入到该位置之后的下一个位置
      // 即将当前 watcher 放入已排序的队列中，且队列仍是排序的
      let i = queue.length - 1;
      while (i > index && queue[i].id > watcher.id) {
        i--;
      }
      queue.splice(i + 1, 0, watcher);
    }
    // queue the flush
    // waiting 是标识 callbacks 数组中是否已经存在刷新 watcher 队列的函数了 (flushSchedulerQueue)，
    // 也就是说，callbacks 数组中只能存在一个 flushSchedulerQueue 函数，多了没意义
    if (!waiting) {
      waiting = true;

      if (process.env.NODE_ENV !== "production" && !config.async) {
        // 直接刷新调度队列
        // 一般不会走这儿，vue默认是异步执行，如果改为同步执行，性能会大大折扣
        flushSchedulerQueue();
        return;
      }
      /**
       * 熟悉的 nextTick => vm.$nextTick、Vue.nextTick
       * 1. 将回调函数 （fulshSchedulerQueue）放入 callbacks 数组
       * 2. 通过 pending 控制向浏览器任务队列中添加 flushCallbacks 函数
       */
      nextTick(flushSchedulerQueue);
    }
  }
}
