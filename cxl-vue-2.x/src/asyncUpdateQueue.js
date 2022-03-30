/**
 * 异步更新队列
 */

// 存储本次更新的所有watcher
const queue = [];

// 标识现在是否正在刷新watcher队列
let flushing = false;
// 标识，保证 callbacks 数组中只会有一个刷新 watcher 队列的函数
let waiting = false;
// 存放刷新 watcher 队列的函数，或者用户调用Vue.nextTick 方法传递的回调函数
const callbacks = [];
// 标识浏览器当前任务队列中是否存在刷新 callbacks 数组的函数
let pending = false;

/**
 * 将watcher放入队列
 * @param {*} watcher 待会儿需要执行的watcher，包括渲染watcher、用户watcher、computed
 */
export function queueWatcher(watcher) {
  if (!queue.includes(watcher)) {
    if (!flushing) {
      //现在没有在刷新watcher队列
      queue.push(watcher);
    } else {
      //正在刷新watcher队列，比如用户watcher的回调函数中更改了某个响应式数据
      //flag 标记当前watcher在for循环中是否已经完成了入队操作
      let flag = false;
      //这时的 watcher 队列是有序的（uid从小到大），需要保证当前 watcher 插入进去后仍然有序
      for (let i = queue.length - 1; i >= 0; i--) {
        if (queue[i].uid < watcher.uid) {
          //找到刚好比当前 watcher.uid 小的那个watcher的位置
          //并将当前 watcher 插入到该位置的后面
          queue.splice(i + 1, 1, watcher);
          flag = true;
          break;
        }
      }

      //说明上面的 for 循环在队列中没找到当前 watcher.uid小的watcher。则将当前watcher插入到队首
      if (!flag) {
        queue.unshift(watcher);
      }
    }

    //表示当前 callbacks 数组中还没有刷新 watcher 队列的函数
    //保证 callbacks 数组中只会有一个刷新 watcher 队列的函数
    //因为如果有多个，没有任何意义，第二个执行的时候 watcher 队列已经为空了
    if (!waiting) {
      waiting = true;
      nextTick(flushSchedulerQueue);
    }
  }
}

/**
 * 负责刷新 watcher 队列的函数，由flushCallbacks 函数调用
 */
function flushSchedulerQueue() {
  //标识正在刷新watcher队列
  flushing = true;
  //给watcher队列排序，根据uid由小到大排序
  queue.sort((a, b) => {
    a.uid - b.uid;
  });
  //遍历队列，依次执行其中每个 watcher 的 run 方法
  while (queue.length) {
    //取出队首的 watcher，并执行 run 方法
    const watcher = queue.shift();
    watcher.run();
  }

  //到这里 watcher 队列刷新完毕
  flushing = waiting = false;
}

/**
 * 将刷新 watcher 队列的函数或者用户调用 Vue.nextTick 方法传递的回调函数放入 callbacks 数组
 * 如果当前的浏览器任务队列中没有刷新 callbacks 的函数，则将 flushCallbacks 函数放入任务队列
 * @param {*} cb
 */
function nextTick(cb) {
  callbacks.push(cb);
  if (!pending) {
    // 表明浏览器当前任务队列中没有刷新 callbacks 数组的函数
    // 将flushCallbacks 函数放入浏览器的微任务队列
    Promise.resolve().then(flushCallbacks);
    // 标识浏览器的微任务队列中，已经存在刷新 callbacks 数组的函数了
    pending = true;
  }
}

/**
 * 负责刷新 callbacks 数组的函数，执行 callbacks 数组中的所有函数
 */
function flushCallbacks() {
  // 表示浏览器任务队列中的 flushCallbacks 函数已经被拿到执行栈执行了
  // 新的 flushCallbacks 函数可以进入浏览器的任务队列了
  pending = false;
  while (callbacks.length) {
    const cb = callbacks.shift();
    cb();
  }
}
