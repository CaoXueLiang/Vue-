import Watcher from "../observer/watcher.js";

/**
 * 初始化 computed 配置项
 * 为每一项实例化一个 Watcher, 并将其computed属性代理到vue实例上
 * 结合 watcher.dirty 和 watcher.evalute 实现 computed 缓存
 * @param {*} vm vue实例
 */
export default function initComputed(vm) {
  const computed = vm.$options.computed;
  // 记录 watcher
  const watcher = (vm._watcher = Object.create(null));
  // 遍历 computed 对象
  for (const key in computed) {
    // 实例化watcher, 回调函数默认懒执行
    watcher[key] = new Watcher(computed[key], { lazy: true }, vm);
    // 将computed属性key 代理到vue实例上
    defineComputed(vm, key);
  }
}

function defineComputed(vm, key) {
  Object.defineProperty(vm, key, {
    get() {
      const watcher = vm._watcher[key];
      // 如果 watcher.dirty = true;说明当前 computed 回调函数在本次渲染周期内没有被执行过
      if (watcher.dirty) {
        // 执行 evalute, 通知watcher执行computed回调函数，重新计算回调函数的值
        console.log("----computed----evalute----");
        watcher.evalute();
      }
      return watcher.value;
    },
    set(newVal) {
      console.warn("no setter");
    },
  });
}
