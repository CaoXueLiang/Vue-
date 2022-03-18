import proxy from "./utils/proxy";
import { observe } from "./observer/index";
export default function initData(vm) {
  let { data } = vm.$options;
  if (!data) {
    vm._data = {};
  } else {
    vm._data = typeof data === "function" ? data() : data;
  }
  // 将`data`上的各个属性代理到 vm实例上，可以通过 this.xxx访问
  for (const key in vm._data) {
    proxy(vm, "_data", key);
  }
  console.log("==========================");
  // 设置响应式
  observe(vm._data);
}
