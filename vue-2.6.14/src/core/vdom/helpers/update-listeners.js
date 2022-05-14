/* @flow */

import { warn, invokeWithErrorHandling } from "core/util/index";
import { cached, isUndef, isTrue, isPlainObject } from "shared/util";

const normalizeEvent = cached(
  (
    name: string
  ): {
    name: string,
    once: boolean,
    capture: boolean,
    passive: boolean,
    handler?: Function,
    params?: Array<any>,
  } => {
    const passive = name.charAt(0) === "&";
    name = passive ? name.slice(1) : name;
    const once = name.charAt(0) === "~"; // Prefixed last, checked first
    name = once ? name.slice(1) : name;
    const capture = name.charAt(0) === "!";
    name = capture ? name.slice(1) : name;
    return {
      name,
      once,
      capture,
      passive,
    };
  }
);

export function createFnInvoker(
  fns: Function | Array<Function>,
  vm: ?Component
): Function {
  function invoker() {
    const fns = invoker.fns;
    if (Array.isArray(fns)) {
      const cloned = fns.slice();
      for (let i = 0; i < cloned.length; i++) {
        invokeWithErrorHandling(cloned[i], null, arguments, vm, `v-on handler`);
      }
    } else {
      // return handler return value for single handlers
      return invokeWithErrorHandling(fns, null, arguments, vm, `v-on handler`);
    }
  }
  invoker.fns = fns;
  return invoker;
}
/**
 * 对比 listeners 和 oldListeners的不同，并调用参数中提供的 add 和 remove 进行相应的注册事件和卸载事件操作
 * 它的实现思路并不复杂：
 * 如果 listeners 对象中存在某个key(也就是事件名)在 oldListeners 中不存在，那么说明这个事件是需要新增的事件；
 * 反过来，如果 oldListeners 中存在某些key(事件名) 在 listeners 中不存在，那么说明这个事件是需要从事件系统中移除的
 */
export function updateListeners(
  on: Object,
  oldOn: Object,
  add: Function,
  remove: Function,
  createOnceHandler: Function,
  vm: Component
) {
  let name, def, cur, old, event;
  for (name in on) {
    def = cur = on[name];
    old = oldOn[name];
    event = normalizeEvent(name);
    /* istanbul ignore if */
    if (__WEEX__ && isPlainObject(def)) {
      cur = def.handler;
      event.params = def.params;
    }
    if (isUndef(cur)) {
      // 判断事件名对应的值是否是 undefined 或 null，如果是则在控制台触发警告
      process.env.NODE_ENV !== "production" &&
        warn(
          `Invalid handler for event "${event.name}": got ` + String(cur),
          vm
        );
    } else if (isUndef(old)) {
      // 判断该事件名在oldOn中是否存在，如果不存在则调用 add 注册事件
      if (isUndef(cur.fns)) {
        cur = on[name] = createFnInvoker(cur, vm);
      }
      if (isTrue(event.once)) {
        cur = on[name] = createOnceHandler(event.name, cur, event.capture);
      }
      add(event.name, cur, event.capture, event.passive, event.params);
    } else if (cur !== old) {
      // 如果事件名在 on 和 oldOn 上都存在，但他们并不相同，则将事件回调替换成on中的回调，
      // 并把on中的回调引用指向真实的事件系统中注册的事件，也就是 oldOn 中对应的事件
      old.fns = cur;
      on[name] = old;
    }
  }
  for (name in oldOn) {
    if (isUndef(on[name])) {
      event = normalizeEvent(name);
      remove(event.name, oldOn[name], event.capture);
    }
  }
}
