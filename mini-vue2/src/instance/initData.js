import { proxy } from "../utils/index.js";
import { observe } from "../observer/index.js";

/**
 * 初始化data
 * 1. 将data上的各个属性代理到 vue 实例上
 * 2. 为data的每个属性设置响应式
 * @param {*} vm
 */
export default function initData(vm) {
  let { data } = vm.$options;
  if (!data) {
    vm._data = {};
  } else {
    vm._data = typeof data === "function" ? data() : data;
  }

  // 代理：将data上的属性代理到vm实例上，使其可以通过 this.xxx 的方式访问
  for (const key in vm._data) {
    proxy(vm, "_data", key);
  }
  // 设置响应式
  observe(vm._data);
}
