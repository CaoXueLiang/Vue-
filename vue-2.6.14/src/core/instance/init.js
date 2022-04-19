/* @flow */

import config from "../config";
import { initProxy } from "./proxy";
import { initState } from "./state";
import { initRender } from "./render";
import { initEvents } from "./events";
import { mark, measure } from "../util/perf";
import { initLifecycle, callHook } from "./lifecycle";
import { initProvide, initInjections } from "./inject";
import { extend, mergeOptions, formatComponentName } from "../util/index";

let uid = 0;

/**
 * Vue的初始化过程，new Vue(options)都做了什么？
 * 1.处理组件配置项
 *   ① 初始化根组件时进行了合并配置项，将全局配置合并到根组件的局部配置上
 *   ② 初始化每个子组件时做了一些性能优化，将组件配置对象上的一些深层次属性放到 vm.$options 选项中，以提高代码的执行效率
 * 2.初始化组件实例关系属性，比如 $parent $children $root $refs
 * 3.处理自定义事件 $on,$off,$emit,$once
 * 4.初始化渲染，解析组件的插槽信息，得到 vm.$slot，处理渲染函数，得到 vm.$createElement 方法，即 h 函数
 * 5.调用 beforeCreate 钩子函数
 * 6.初始化组件的 inject 配置项，得到 ret[key] = val 形式的配置对象，然后对该配置对象进行浅层的响应式处理（只处理了对象第一层数据），并代理每个 key 到 vm 实例上
 * 7.初始化数据，包括 props,data,computed,watcher,methods等选项
 * 8.解析组件配置项上的 provide 对象，将其挂载到 vm._provided 属性上
 * 9.调用 created 钩子函数
 * 10.如果配置项中有 el 属性，则调用 vm.$mount方法。进入挂载阶段
 */

// Vue的初始化过程，new Vue(options)都做了什么？
//1. 处理组件配置项信息 1.对于根组件，将vue的全局配置合并到根组件的局部配置中 2.对于子组件主要做了一些性能优化，将一些深层次的属性赋值到VM.$options上，提高执行效率
//2. 初始化组件实例关系属性，$parent $children $root $refs
//3. 初始化自定义事件，$on $off $once $emit
//4. 初始化渲染，解析插槽信息得到vm.$slot 处理渲染函数得到vm.createElement 方法，即h函数
//5. 调用 beforeCreated 钩子函数
//6. 处理组件上的inject 配置项，得到ret[key]=val,将每个key代理到vm实例上，并进行浅层次的响应式处理
//7. 数据响应式处理 props,methods,data,computed,watcher
//8. 解析组件上的 provide对象，并挂载到vm._provided 属性上
//9. 调用 created 钩子函数
//10.判断是否有el属性，如果存在则调用vm.$mount方法进入挂载阶段

export function initMixin(Vue: Class<Component>) {
  Vue.prototype._init = function (options?: Object) {
    //vue实例
    const vm: Component = this;
    vm._uid = uid++;
    vm._isVue = true;

    // 处理组件配置项
    if (options && options._isComponent) {
      console.log("--vue子组件--", vm);
      /**
       * 每个子组件的初始化走这里，这里只做了一些性能优化
       * 将组件配置对象上的一些深层次属性放到 vm.$options 选项中，以提高代码的执行效率
       */
      initInternalComponent(vm, options);
    } else {
      console.log("--vue根组件--", vm);
      /**
       * 初始化根组件走这里，合并 vue 的全局配置到根组件的局部配置，比如 Vue.component 注册的全局组件会合并到根实例的 components 选项中
       *  至于每个子组件的选项合并则发生在两个地方：
       *   1、Vue.component 方法注册的全局组件在注册时做了选项合并
       *   2、{ components: { xx } } 方式注册的局部组件在执行编译器生成的 render 函数时做了选项合并，包括根组件中的 components 配置
       */
      vm.$options = mergeOptions(
        resolveConstructorOptions(vm.constructor),
        options || {},
        vm
      );
    }

    if (process.env.NODE_ENV !== "production") {
      //设置代理，将vm.$options的属性设置到 vm._renderProxy
      initProxy(vm);
    } else {
      vm._renderProxy = vm;
    }

    vm._self = vm;
    //初始化组件实例关系属性，比如：$parent,$children,$root,$refs
    initLifecycle(vm);
    /**
     * 初始化自定义事件，这里需要注意一点，所有我们在 <comp @click="handleClick" /> 上注册的事件，监听者不是父组件
     * 而是子组件本身，也就是说事件的派发和监听者都是子组件本身，和父组件无关
     * 初始化事件中心，$once,$on,$off,$emit
     */
    initEvents(vm);
    //初始化渲染，解析组件的插槽信息，得到 vm.$slot，处理渲染函数，得到 vm.$createElement 方法，即 h 函数
    initRender(vm);
    //调用 beforeCreate 钩子函数
    callHook(vm, "beforeCreate");
    //初始化组件的Inject配置项
    initInjections(vm);
    //初始化数据，props,data,computed,watcher,computed
    initState(vm);
    //解析组件配置项上的 provide 对象，将其挂载到 vm._provide 属性上
    initProvide(vm);
    //调用 created 钩子函数
    callHook(vm, "created");

    //如果配置项上有 el 属性，则调用 $mount 方法，进入挂载阶段
    if (vm.$options.el) {
      vm.$mount(vm.$options.el);
    }
  };
}

/**
 * 子组件的初始化走这里，主要进行一些性能优化
 * 将一些深层次的属性放到vm.$options。以提高执行效率
 * @param {*} vm
 * @param {*} options
 */
export function initInternalComponent(
  vm: Component,
  options: InternalComponentOptions
) {
  const opts = (vm.$options = Object.create(vm.constructor.options));
  // doing this because it's faster than dynamic enumeration.
  const parentVnode = options._parentVnode;
  opts.parent = options.parent;
  opts._parentVnode = parentVnode;

  // options._parentVnode.componentOptions.propsData;
  const vnodeComponentOptions = parentVnode.componentOptions;
  opts.propsData = vnodeComponentOptions.propsData;
  opts._parentListeners = vnodeComponentOptions.listeners;
  opts._renderChildren = vnodeComponentOptions.children;
  opts._componentTag = vnodeComponentOptions.tag;

  if (options.render) {
    opts.render = options.render;
    opts.staticRenderFns = options.staticRenderFns;
  }
}

/**
 * 从组件构造函数中解析配置对象 options，并合并基类对象
 * @param {*} Ctor
 * @returns
 */
export function resolveConstructorOptions(Ctor: Class<Component>) {
  let options = Ctor.options;
  // console.log("---options---", options);
  if (Ctor.super) {
    //存在基类，递归解析基类构造函数的选项
    const superOptions = resolveConstructorOptions(Ctor.super);
    const cachedSuperOptions = Ctor.superOptions;
    if (superOptions !== cachedSuperOptions) {
      // super option changed,
      // need to resolve new options.
      // 说明基类构造函数选项已经发生改变，需要重新设置
      Ctor.superOptions = superOptions;
      // check if there are any late-modified/attached options (#4976)
      // 检查 Ctor.options 上是否有任何后期修改/附加的选项（＃4976）
      const modifiedOptions = resolveModifiedOptions(Ctor);
      // update base extend options
      // 如果存在被修改或增加的选项，则合并两个选项
      if (modifiedOptions) {
        extend(Ctor.extendOptions, modifiedOptions);
      }
      // 选项合并，将合并结果赋值为 Ctor.options
      options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions);
      if (options.name) {
        options.components[options.name] = Ctor;
      }
    }
  }
  return options;
}

function resolveModifiedOptions(Ctor: Class<Component>): ?Object {
  let modified;
  const latest = Ctor.options;
  const sealed = Ctor.sealedOptions;
  for (const key in latest) {
    if (latest[key] !== sealed[key]) {
      if (!modified) modified = {};
      modified[key] = latest[key];
    }
  }
  return modified;
}
