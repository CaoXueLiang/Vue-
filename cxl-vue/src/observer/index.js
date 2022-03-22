import { arrayMethods } from "./array.js";
import { def } from "../utils/utils.js";
import Dep from "./dep.js";

// 通过 observe为对象设置响应式
export function observe(value) {
  // 递归结束条件
  if (typeof value !== "object") {
    return;
  }
  let ob;
  // 如果 value.__ob__ 属性已经存在，说明value对象已经具备响应式能力，直接返回这个 Observer实例
  if (value.hasOwnProperty("__ob__")) {
    ob = value.__ob__;
  } else {
    ob = new Observer(value);
  }
  return ob;
}

/**
 * 为对象和数组设置响应式
 */
class Observer {
  constructor(value) {
    // 为 Observer 实例，设置一个Dep,方便在更新对象本身时使用，比如：数组通知依赖更新时就会用到
    this.dep = new Dep();
    def(value, "__ob__", this);
    if (Array.isArray(value)) {
      //判断是否是数组
      value.__proto__ = arrayMethods;
      this.observeArray(value);
    } else {
      //判断是否是对象
      this.walk(value);
    }
  }

  walk(obj) {
    for (let key in obj) {
      defineReactive(obj, key, obj[key]);
    }
  }

  observeArray(arr) {
    for (let item in arr) {
      //处理数组中的元素为对象的情况
      observe(item);
    }
  }
}

/**
 * 通过 Object.defineProperty 为`obj.key`设置 getter setter 进行拦截
 * @param {*} obj
 * @param {*} key
 * @param {*} val
 */
function defineReactive(obj, key, val) {
  // 递归调用 observe,处理 val 仍未对象的情况
  const childOb = observe(val);
  // 为对象属性上设置 Dep
  const dep = new Dep();
  Object.defineProperty(obj, key, {
    get() {
      if (Dep.target) {
        dep.depend();
        if (childOb) {
          childOb.dep.depend();
        }
      }
      return val;
    },
    set(newVal) {
      if (val === newVal) {
        return;
      }
      val = newVal;
      // 对新值进行响应式处理，这里针对的是新值为非原始值的情况，比如：val为数组和对象
      observe(val);
      // dep 发送通知
      dep.notify();
    },
  });
}
