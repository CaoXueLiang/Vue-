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
 * 2.初始化组件实例的关系属性，比如 $parent $children $root $refs
 * 3.初始化事件
 * 4.调用 beforeCreate 钩子函数
 * 5.初始化数据，包括 props,data,computed,watcher,methods等选项
 * 6.调用 created 钩子函数
 * 7.如果配置项中有 el 属性，则调用 vm.$mount方法。进入挂载阶段
 */

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
    //初始化生命周期。初始化组件实例关系属性，比如：$parent,$children,$root,$refs
    initLifecycle(vm);
    /**
     * 初始化自定义事件，这里需要注意一点，所有我们在 <comp @click="handleClick" /> 上注册的事件，监听者不是父组件
     * 而是子组件本身，也就是说事件的派发和监听者都是子组件本身，和父组件无关
     * 初始化事件中心，$once,$on,$off,$emit
     */
    initEvents(vm);
    //初始化渲染，
    initRender(vm);
    //调用 beforeCreate 钩子函数
    callHook(vm, "beforeCreate");
    initInjections(vm);
    //初始化数据，props,data,computed,watcher,computed
    initState(vm);
    initProvide(vm);
    //调用 created 钩子函数
    callHook(vm, "created");

    //如果配置项上有 el 属性，则调用 $mount 方法，进入挂载阶段
    if (vm.$options.el) {
      vm.$mount(vm.$options.el);
    }
  };
}

export function initInternalComponent(
  vm: Component,
  options: InternalComponentOptions
) {
  const opts = (vm.$options = Object.create(vm.constructor.options));
  // doing this because it's faster than dynamic enumeration.
  const parentVnode = options._parentVnode;
  opts.parent = options.parent;
  opts._parentVnode = parentVnode;

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

export function resolveConstructorOptions(Ctor: Class<Component>) {
  let options = Ctor.options;
  if (Ctor.super) {
    const superOptions = resolveConstructorOptions(Ctor.super);
    const cachedSuperOptions = Ctor.superOptions;
    if (superOptions !== cachedSuperOptions) {
      // super option changed,
      // need to resolve new options.
      Ctor.superOptions = superOptions;
      // check if there are any late-modified/attached options (#4976)
      const modifiedOptions = resolveModifiedOptions(Ctor);
      // update base extend options
      if (modifiedOptions) {
        extend(Ctor.extendOptions, modifiedOptions);
      }
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
