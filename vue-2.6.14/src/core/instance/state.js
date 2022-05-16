/* @flow */

import config from "../config";
import Watcher from "../observer/watcher";
import Dep, { pushTarget, popTarget } from "../observer/dep";
import { isUpdatingChildComponent } from "./lifecycle";

import {
  set,
  del,
  observe,
  defineReactive,
  toggleObserving,
} from "../observer/index";

import {
  warn,
  bind,
  noop,
  hasOwn,
  hyphenate,
  isReserved,
  handleError,
  nativeWatch,
  validateProp,
  isPlainObject,
  isServerRendering,
  isReservedAttribute,
  invokeWithErrorHandling,
} from "../util/index";

const sharedPropertyDefinition = {
  enumerable: true,
  configurable: true,
  get: noop,
  set: noop,
};

export function proxy(target: Object, sourceKey: string, key: string) {
  sharedPropertyDefinition.get = function proxyGetter() {
    return this[sourceKey][key];
  };
  sharedPropertyDefinition.set = function proxySetter(val) {
    this[sourceKey][key] = val;
  };
  Object.defineProperty(target, key, sharedPropertyDefinition);
}

/**
 * 做了两件事：
 * 1.数据响应式入口：分别处理 props,methods,data,computed,watch
 * 2.优先级：props,method,data,computed 对象中的属性不能重复，优先级和列出的顺序一致
 */

/**
 * computed 和 watch 在本质是没有区别的，都是通过 watcher 去实现的响应式
 * 非要说有区别，那也只是在使用方式上的区别，简单来说
 *   1.watch:适用于当数据发生变化时执行异步或者开销较大的操作时使用，即需要长时间等待的操作可以放在watch中
 *   2.computed:其中更适合做一些同步操作
 */
export function initState(vm: Component) {
  // 用来保存当前组件中所有的 watcher 实例
  // 无论是使用 vm.$watch 注册的实例，还是使用 watch 选项添加的 watcher 实例，都会添加到 vm._watchers 中
  vm._watchers = [];
  const opts = vm.$options;
  console.log("----vm.$options---", opts);
  //处理 props 对象，为props对象的每个属性设置响应式，并将其代理到 vm 实例上
  if (opts.props) initProps(vm, opts.props);
  //处理 methods 对象，校验每个属性的值是否为函数，和props属性值进行判重处理,以及vue实例上的方法判重，最后得到`vm[key] = methods[key]`
  if (opts.methods) initMethods(vm, opts.methods);
  if (opts.data) {
    //1.判重处理，data上的属性不能和`props`和`methods`对象上的属性相同
    //2.代理data上的属性，到`vm`实例
    //3.为 data 上的数据设设置响应式
    initData(vm);
  } else {
    observe((vm._data = {}), true /* asRootData */);
  }
  //1.为`computed[key]`创建watcher实例，默认是懒执行
  //2.代理`computed[key]`到vue实例
  //3.判重，computed 中的key,不能和data,props,methods中的属性重复
  if (opts.computed) initComputed(vm, opts.computed);
  if (opts.watch && opts.watch !== nativeWatch) {
    //1.为每个`watcher.key` 创建`watcher`实例，key和watcher实例可能是1对多的关系
    //2.如果设置了immediate,则立即执行回调函数
    initWatch(vm, opts.watch);
  }
}

function initProps(vm: Component, propsOptions: Object) {
  const propsData = vm.$options.propsData || {};
  const props = (vm._props = {});
  // cache prop keys so that future props updates can iterate using Array
  // instead of dynamic object key enumeration.
  // 缓存 props 的每个key,做性能优化
  const keys = (vm.$options._propKeys = []);
  const isRoot = !vm.$parent;
  // root instance props should be converted
  // 判断当前组件是否是根组件，如果不是，那么不需要将props数据转换为响应式数据
  if (!isRoot) {
    toggleObserving(false);
  }

  // 遍历props对象中的key
  for (const key in propsOptions) {
    keys.push(key);
    // 获取props[key]的默认值
    const value = validateProp(key, propsOptions, propsData, vm);
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== "production") {
      const hyphenatedKey = hyphenate(key);
      if (
        isReservedAttribute(hyphenatedKey) ||
        config.isReservedAttr(hyphenatedKey)
      ) {
        warn(
          `"${hyphenatedKey}" is a reserved attribute and cannot be used as component prop.`,
          vm
        );
      }
      defineReactive(props, key, value, () => {
        if (!isRoot && !isUpdatingChildComponent) {
          warn(
            `Avoid mutating a prop directly since the value will be ` +
              `overwritten whenever the parent component re-renders. ` +
              `Instead, use a data or computed property based on the prop's ` +
              `value. Prop being mutated: "${key}"`,
            vm
          );
        }
      });
    } else {
      // 为props的每个key设置响应式
      defineReactive(props, key, value);
    }
    // static props are already proxied on the component's prototype
    // during Vue.extend(). We only need to proxy props defined at
    // instantiation here.
    if (!(key in vm)) {
      //将key代理到vm实例上
      proxy(vm, `_props`, key);
    }
  }
  toggleObserving(true);
}

/**
 * 1.判重处理，data上的属性不能和props和methods对象上的属性重名
 * 2.将data属性代理到vm实例上
 * 3.为data数据设置响应式
 * @param {*} vm
 */
function initData(vm: Component) {
  let data = vm.$options.data;
  data = vm._data = typeof data === "function" ? getData(data, vm) : data || {};
  if (!isPlainObject(data)) {
    data = {};
    process.env.NODE_ENV !== "production" &&
      warn(
        "data functions should return an object:\n" +
          "https://vuejs.org/v2/guide/components.html#data-Must-Be-a-Function",
        vm
      );
  }
  // proxy data on instance
  const keys = Object.keys(data);
  const props = vm.$options.props;
  const methods = vm.$options.methods;
  let i = keys.length;
  while (i--) {
    const key = keys[i];
    if (process.env.NODE_ENV !== "production") {
      if (methods && hasOwn(methods, key)) {
        warn(
          `Method "${key}" has already been defined as a data property.`,
          vm
        );
      }
    }
    if (props && hasOwn(props, key)) {
      process.env.NODE_ENV !== "production" &&
        warn(
          `The data property "${key}" is already declared as a prop. ` +
            `Use prop default value instead.`,
          vm
        );
    } else if (!isReserved(key)) {
      proxy(vm, `_data`, key);
    }
  }
  // observe data
  observe(data, true /* asRootData */);
}

export function getData(data: Function, vm: Component): any {
  // #7573 disable dep collection when invoking data getters
  pushTarget();
  try {
    return data.call(vm, vm);
  } catch (e) {
    handleError(e, vm, `data()`);
    return {};
  } finally {
    popTarget();
  }
}

const computedWatcherOptions = { lazy: true };

/**
 * 1. 为`computed[key]`创建watcher实例，默认是懒执行
 * 2. 将属性值代理到vm实例上
 * 3. 判重处理，computed[key]属性不能和props,methods,data中的属性重名
 * @param {*} vm
 * @param {*} computed
 */
function initComputed(vm: Component, computed: Object) {
  // $flow-disable-line
  const watchers = (vm._computedWatchers = Object.create(null));
  // computed properties are just getters during SSR
  // 是否是服务端渲染
  const isSSR = isServerRendering();

  //遍历computed对象属性
  for (const key in computed) {
    const userDef = computed[key];
    // 获取computed属性值，判断是函数还是对象 如果是对象则获取get方法
    const getter = typeof userDef === "function" ? userDef : userDef.get;
    if (process.env.NODE_ENV !== "production" && getter == null) {
      warn(`Getter is missing for computed property "${key}".`, vm);
    }

    if (!isSSR) {
      // 为每个key创建watcher实例,默认是懒执行
      // create internal watcher for the computed property.
      watchers[key] = new Watcher(
        vm,
        getter || noop,
        noop,
        computedWatcherOptions
      );
    }

    // component-defined computed properties are already defined on the
    // component prototype. We only need to define computed properties defined
    // at instantiation here.
    if (!(key in vm)) {
      //将computed的属性代理到vm实例上
      defineComputed(vm, key, userDef);
    } else if (process.env.NODE_ENV !== "production") {
      if (key in vm.$data) {
        warn(`The computed property "${key}" is already defined in data.`, vm);
      } else if (vm.$options.props && key in vm.$options.props) {
        warn(
          `The computed property "${key}" is already defined as a prop.`,
          vm
        );
      } else if (vm.$options.methods && key in vm.$options.methods) {
        warn(
          `The computed property "${key}" is already defined as a method.`,
          vm
        );
      }
    }
  }
}

export function defineComputed(
  target: any,
  key: string,
  userDef: Object | Function
) {
  // 是否需要缓存，服务端渲染不需要缓存
  const shouldCache = !isServerRendering();
  if (typeof userDef === "function") {
    sharedPropertyDefinition.get = shouldCache
      ? createComputedGetter(key)
      : createGetterInvoker(userDef);
    sharedPropertyDefinition.set = noop;
  } else {
    sharedPropertyDefinition.get = userDef.get
      ? shouldCache && userDef.cache !== false
        ? createComputedGetter(key)
        : createGetterInvoker(userDef.get)
      : noop;
    sharedPropertyDefinition.set = userDef.set || noop;
  }
  if (
    process.env.NODE_ENV !== "production" &&
    sharedPropertyDefinition.set === noop
  ) {
    sharedPropertyDefinition.set = function () {
      warn(
        `Computed property "${key}" was assigned to but it has no setter.`,
        this
      );
    };
  }
  Object.defineProperty(target, key, sharedPropertyDefinition);
}

/**
 * computed属性值会缓存的原理是：watcher.ditry, watcher.evaluate, watcher.update实现的
 * 执行 this.xxx （xxx为计算属性） 实际上是访问 computedGetter函数
 * 每当计算属性被读取时，computedGetter 函数都会被执行
 *
 * 存在的问题❗：https://hub.fastgit.xyz/vuejs/vue/issues/7767
 * revert: https://hub.fastgit.xyz/vuejs/vue/commit/6b1d431a89f3f7438d01d8cc98546397f0983287
 * 回退的原因：https://hub.fastgit.xyz/vuejs/vue/issues/8446
 */
function createComputedGetter(key) {
  return function computedGetter() {
    const watcher = this._computedWatchers && this._computedWatchers[key];
    if (watcher) {
      if (watcher.dirty) {
        watcher.evaluate();
      }
      // 这段代码的目的在于将读取计算属性的那个 watcher 添加到计算属性所依赖的所有状态的依赖列表中
      // 换句话说，就是让读取计算属性的那个 watcher 持续观察计算属性所依赖的状态的变化
      /**
       * this.deps 是计算属性中用到的所有状态的dep实例，而依次执行了dep实例的depend方法
       * 就是将组件的 watcher 依次加入到这些dep实例的依赖列表中，这就实现了让组件的 watcher
       * 观察计算属性中用到的所有状态的变化，当这些状态发生变化时，组件的watcher会收到通知，从而重新渲染操作
       */
      if (Dep.target) {
        watcher.depend();
      }
      return watcher.value;
    }
  };
}

function createGetterInvoker(fn) {
  return function computedGetter() {
    return fn.call(this, this);
  };
}

/**
 * 校验每个属性的值是否为函数，和props属性判重处理，以及vue实例上的方法判重,避免定义以`_`和`$`开头的组件方法
 * 设置 vm[key] = methods[key]
 * @param {*} vm
 * @param {*} methods
 */
function initMethods(vm: Component, methods: Object) {
  const props = vm.$options.props;
  for (const key in methods) {
    if (process.env.NODE_ENV !== "production") {
      if (typeof methods[key] !== "function") {
        warn(
          `Method "${key}" has type "${typeof methods[
            key
          ]}" in the component definition. ` +
            `Did you reference the function correctly?`,
          vm
        );
      }
      if (props && hasOwn(props, key)) {
        warn(`Method "${key}" has already been defined as a prop.`, vm);
      }
      if (key in vm && isReserved(key)) {
        warn(
          `Method "${key}" conflicts with an existing Vue instance method. ` +
            `Avoid defining component methods that start with _ or $.`
        );
      }
    }
    vm[key] =
      typeof methods[key] !== "function" ? noop : bind(methods[key], vm);
  }
}

/**
 * 1. 为每个key创建watcher实例，key和watcher实例可能是1对多的关系
 * 2. 如果设置了immediate=true 则会在侦听开始之后被立即调用。如果设置了deep=true则被监听的对象的属性改变了，回调函数也会被执行，不管嵌套有多深
 * @param {*} vm
 * @param {*} watch
 */
function initWatch(vm: Component, watch: Object) {
  for (const key in watch) {
    const handler = watch[key];
    if (Array.isArray(handler)) {
      for (let i = 0; i < handler.length; i++) {
        createWatcher(vm, key, handler[i]);
      }
    } else {
      createWatcher(vm, key, handler);
    }
  }
}

function createWatcher(
  vm: Component,
  expOrFn: string | Function,
  handler: any,
  options?: Object
) {
  if (isPlainObject(handler)) {
    options = handler;
    handler = handler.handler;
  }
  if (typeof handler === "string") {
    handler = vm[handler];
  }
  return vm.$watch(expOrFn, handler, options);
}

export function stateMixin(Vue: Class<Component>) {
  // flow somehow has problems with directly declared definition object
  // when using Object.defineProperty, so we have to procedurally build up
  // the object here.
  const dataDef = {};
  dataDef.get = function () {
    return this._data;
  };
  const propsDef = {};
  propsDef.get = function () {
    return this._props;
  };
  if (process.env.NODE_ENV !== "production") {
    dataDef.set = function () {
      warn(
        "Avoid replacing instance root $data. " +
          "Use nested data properties instead.",
        this
      );
    };
    propsDef.set = function () {
      warn(`$props is readonly.`, this);
    };
  }
  // $data 和 $props 这两个是实例属性，不是实例方法
  // 将`data`属性和`props`属性挂载到 Vue.prtotype 对象上
  // 这样在程序中就可以使用 this.$data 和 this.$props 来访问 data 和 props 对象了
  Object.defineProperty(Vue.prototype, "$data", dataDef);
  Object.defineProperty(Vue.prototype, "$props", propsDef);

  Vue.prototype.$set = set;
  Vue.prototype.$delete = del;

  /**
   * 1. 兼容性处理，保证 new Watcher 时的cb为函数
   * 2. 标识watcher为用户watcher.(options.user = true)
   * 3. 创建watcher实例
   * 4. 如果设置了 immediate,则立即执行一次 cb
   * 5. 返回 unWatchFn 函数，用于解除监听
   * @param {*} expOrFn
   * @param {*} cb
   * @param {*} options
   * @returns
   */
  Vue.prototype.$watch = function (
    expOrFn: string | Function,
    cb: any,
    options?: Object
  ): Function {
    const vm: Component = this;
    //兼容性处理，因为用户调用 vm.$watch时 设置的 cb 可能是对象
    if (isPlainObject(cb)) {
      return createWatcher(vm, expOrFn, cb, options);
    }
    options = options || {};
    // options.user 表示是用户 watcher。还有渲染 watcher,即 updateComponent 方法中实例化的 watcher
    options.user = true;
    // 创建 watcher
    const watcher = new Watcher(vm, expOrFn, cb, options);
    // 如果用户设置了 immediate = true, 则立即执行一次回调函数
    if (options.immediate) {
      const info = `callback for immediate watcher "${watcher.expression}"`;
      pushTarget();
      invokeWithErrorHandling(cb, vm, [watcher.value], vm, info);
      popTarget();
    }
    // 返回一个 unWatchFn 函数,用于解除监听
    return function unwatchFn() {
      watcher.teardown();
    };
  };
}
