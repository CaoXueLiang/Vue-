import { isObject, hasOwn, def } from "./utils";
import { arrayMethods } from "./array";
import Dep from "./dep";

/**
 * 定义对象上的响应性属性
 */
export function defineReactive(obj, key, val) {
  if (arguments.length === 2) {
    val = obj[key];
  }

  const dep = new Dep();

  let childOb = observe(val); //下一级可能也是对象，需要`Observe`

  Object.defineProperty(obj, key, {
    configurable: true,
    enumerable: true,
    set(newValue) {
      // console.log(`设置属性:${key}  ${newValue}`);
      if (val === newValue) {
        return;
      }
      val = newValue;
      //如果新设置的是对象，需要从新`Observe`
      childOb = observe(val);
      //发布通知
      dep.notify();
      // console.log(dep);
    },
    get() {
      //如果处于依赖收集阶段
      if (Dep.target) {
        dep.depend();
        if (childOb) {
          childOb.dep.depend();
        }
      }
      // console.log(`访问属性：${val}`);
      return val;
    },
  });
}

/**
 * 返回`observer`实例
 * Attempt to create an observer instance for a value,
 * returns the new observer if successfully observed,
 * or the existing observer if the value already has one.
 */
export function observe(value) {
  if (!isObject(value)) {
    return;
  }
  let ob;
  if (hasOwn(value, "__ob__") && value.__ob__ instanceof Observer) {
    ob = value.__ob__;
  } else {
    ob = new Observer(value);
    def(value, "__ob__", ob, false); //`__ob__`定义为不可枚举属性
  }
  return ob;
}

/**
 * 观察者类
 * 附加到每个被观察对象的观察者类。一旦附加，观察者将目标对象的属性键转换为收集依赖项和分派更新的getter/setter。
 */
export class Observer {
  constructor(value) {
    this.value = value;
    //每一个`Observer`身上都有一个Dep类
    this.dep = new Dep();
    if (Array.isArray(value)) {
      //将这个数组的原型，指向`arrayMethods`
      Object.setPrototypeOf(value, arrayMethods);
      this.observeArray(value);
    } else {
      this.walk(value);
    }
  }

  //遍历所有属性并将它们转换为getter/setter。只有当值类型为`Object`时才应该调用此方法
  walk(obj) {
    const keys = Object.keys(obj);
    for (let index = 0; index < keys.length; index++) {
      defineReactive(obj, keys[index]);
    }
  }

  //观察数组中的项
  observeArray(items) {
    for (let index = 0; index < items.length; index++) {
      const element = items[index];
      observe(element);
    }
  }
}
