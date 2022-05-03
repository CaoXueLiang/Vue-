import { def } from "../utils/index.js";
import protoArgument from "./array.js";
import Dep from "./dep.js";

/**
 * 通过 Observer 类为对象设置响应式能力
 * @param {*} value
 * @returns Observer 实例
 */
export function observe(value) {
  // 当value不是对象时直接结束
  if (typeof value !== "object") {
    return;
  }
  // 如果 value.__ob__属性已经存在，说明value对象已经具备响应式能力。直接返回已有的响应式对象
  // 否则返回新的`Observer`实例
  if (value.hasOwnProperty("__ob__")) {
    return value.__ob__;
  } else {
    return new Observer(value);
  }
}

/**
 * 为普通对象或者数组设置响应式的入口
 */
class Observer {
  constructor(value) {
    // 为对象本身设置一个dep, 方便在更新对象本身时使用，比如：数组通知依赖更新时就会用到
    this.dep = new Dep();
    // 为对象设置 __ob__ 属性，值为this即当前的实例对象。标识当前对象是一个响应式对象了
    def(value, "__ob__", this);
    if (Array.isArray(value)) {
      //数组的响应式
      protoArgument(value);
      this.observeArray(value);
    } else {
      //对象的响应式
      this.walk(value);
    }
  }

  // 遍历对象的每个属性
  walk(obj) {
    for (const key in obj) {
      defineReactive(obj, key, obj[key]);
    }
  }

  // 遍历数组的每个元素，为每个元素设置响应式
  // 这里是为了处理数组中的元素为对象的情况，以达到 this.arr[idx].xx 是响应式的目的
  observeArray(arr) {
    for (let index = 0; index < arr.length; index++) {
      const element = arr[index];
      observe(element);
    }
  }
}

/**
 * 通过 Object.defineProperty 为 obj.key 设置 getter、setter 拦截
 * getter 时收集依赖
 * setter 时通知依赖,进而执行 watcher.update
 */
function defineReactive(obj, key, value) {
  // 递归调用 observe，处理value仍为对象的情况
  const childOb = observe(value);
  // 为每个属性设置dep, 和之前的为对象设置dep不同
  const dep = new Dep();
  Object.defineProperty(obj, key, {
    get() {
      // 读取数据时如果 Dep.target 不为null, 则进行依赖收集
      if (Dep.target) {
        dep.depend();
        // 如果存在子 ob,则顺道一块完成依赖收集
        if (childOb) {
          childOb.dep.depend();
        }
      }
      console.log(`getter: key = ${key}`);
      return value;
    },
    set(newValue) {
      console.log(`setter: ${key} = ${newValue}`);
      if (newValue === value) {
        return;
      }
      value = newValue;
      // 对新值进行响应式处理，这里针对的是新值为非原始值的情况，比如:value为对象或者数组
      observe(value);
      // 数据更新时，让dep通知自己收集到的所有 watcher执行 update 方法
      dep.notify();
    },
  });
}
