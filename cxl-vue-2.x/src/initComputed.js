import Watcher from "./observer/watcher.js";

/**
 * 初始化 computed 配置项
 * 为每一项实例化一个 Watcher,并将其computed属性代理到Vue实例上，使其可以使用 this.xx 访问
 * 结合 watcher.dirty 和 watcher.evalute 实现 computed 缓存
 * @param {*} vm
 */
export default function initComputed(vm) {
  // 获取 computed 配置项
  const computed = vm.$options.computed;
  const watcher = (vm._watcher = Object.create(null));

  // 遍历computed对象
  for (const key in computed) {
    watcher[key] = new Watcher(computed[key], { lazy: true }, vm);
    // 将`computed`的属性代理到`vue`实例上
    defineComputed(vm, key);
  }
}

/**
 * 将计算属性代理到 vue 实例上
 */
function defineComputed(vm, key) {
  Object.defineProperty(vm, key, {
    get() {
      const watcher = vm._watcher[key];
      if (watcher.dirty) {
        // 执行 evalute,通知watcher执行 computed 回调函数
        watcher.evalute();
        console.log("----computed----evalute----");
      }
      return watcher.value;
    },
    set() {
      console.log("no setter");
    },
  });
}
