// 存储本次更新的所有 watcher
const queue = [];
// 存放刷新watcher队列的函数，或者用户调用 Vue.nextTick 方法传递的回调函数
const callbacks = [];

// 标识现在是否正在刷新watcher队列
let flushing = false;
// 保证callbacks数组中只会有一个刷新watcher队列的函数
let waiting = false;
// 标识当前浏览器的异步任务队列中只有一个刷新callback数组的函数
let pending = false;

/**
 * 将watcher放入到队列
 * @param {*} watcher 待会儿需要被执行的watcher, 包括渲染watcher、用户watcher、computed的watcher
 */
export default function queueWatcher(watcher) {
  // 防止重复入队
  if (queue.includes(watcher)) {
    return;
  }
  if (!flushing) {
    // 现在没有在刷新watcher队列
    queue.push(watcher);
  } else {
    // 正在刷新watcher队列，比如用户watcher的回调函数中更改了某个响应式数据
    let flag = false; //标识当前watcher在for循环中是否已经完成了入队操作
    // 这时的watcher队列是有序的（uid从小到大），需要保证当前watcher插入进去之后仍然有序
    for (let index = queue.length - 1; index >= 0; index--) {
      const currentWatcher = queue[index];
      if (currentWatcher.uid < watcher.uid) {
        queue.splice(index + 1, 0, watcher);
        flag = true;
        break;
      }
    }
    // 说明在上面的for循环在队列中没有找到比当前watcher.uid小的watcher
    // 将当前watcher插入到队首
    if (!flag) {
      queue.unshift(watcher);
    }
  }

  // 保证当前callbacks数组中只有一个刷新watcher队列的函数
  // 如果有多个没有任何意义，第二个执行的时候watcher队列已经为空了
  if (!waiting) {
    waiting = true;
    nextTick(flushSchedulerQueue);
  }
}

/**
 * 负责刷新watcher队列的函数，由 flushCallbacks 函数调用
 */
function flushSchedulerQueue() {
  // 标识正在刷新watcher队列
  flushing = true;
  queue.sort((a, b) => a.uid - b.uid);
  while (queue.length) {
    const watcher = queue.shift();
    watcher.run();
  }
  // 到这里watcher队列刷新完毕
  flushing = waiting = false;
}

/**
 * 将刷新watcher队列的函数（flushSchedulerQueue）或者用户调用 Vue.nextTick 方法传递的回调函数放入callbacks数组
 * 如果当前的浏览器任务队列中没有刷新callbacks数组的函数，则将 flushCallbacks 函数放到浏览器的异步任务队列中
 * @param {*} cb flushSchedulerQueue 或者 用户传递的回调函数
 */
function nextTick(cb) {
  callbacks.push(cb);
  if (!pending) {
    Promise.resolve().then(flushCallbacks);
    pending = true;
  }
}

/**
 * 负责刷新callbacks数组的函数
 * 执行callbacks 数组中所有函数：包括flushSchedulerQueue 和 用户传递的回调函数
 */
function flushCallbacks() {
  // 表示浏览器任务队列中的 flushCallbacks 函数已经被拿到执行栈执行了。
  // 新的 flushCallbacks 函数可以进入浏览器的任务队列了
  pending = false;
  while (callbacks.length) {
    const cb = callbacks.shift();
    cb();
  }
}
