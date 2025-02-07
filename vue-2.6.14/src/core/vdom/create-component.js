/* @flow */

import VNode from "./vnode";
import { resolveConstructorOptions } from "core/instance/init";
import { queueActivatedComponent } from "core/observer/scheduler";
import { createFunctionalComponent } from "./create-functional-component";

import { warn, isDef, isUndef, isTrue, isObject } from "../util/index";

import {
  resolveAsyncComponent,
  createAsyncPlaceholder,
  extractPropsFromVNodeData,
} from "./helpers/index";

import {
  callHook,
  activeInstance,
  updateChildComponent,
  activateChildComponent,
  deactivateChildComponent,
} from "../instance/lifecycle";

import {
  isRecyclableComponent,
  renderRecyclableComponentTemplate,
} from "weex/runtime/recycle-list/render-component-template";

// inline hooks to be invoked on component VNodes during patch
const componentVNodeHooks = {
  init(vnode: VNodeWithData, hydrating: boolean): ?boolean {
    if (
      vnode.componentInstance &&
      !vnode.componentInstance._isDestroyed &&
      vnode.data.keepAlive
    ) {
      // kept-alive components, treat as a patch
      const mountedNode: any = vnode; // work around flow
      componentVNodeHooks.prepatch(mountedNode, mountedNode);
    } else {
      const child = (vnode.componentInstance = createComponentInstanceForVnode(
        vnode,
        activeInstance
      ));
      child.$mount(hydrating ? vnode.elm : undefined, hydrating);
    }
  },

  prepatch(oldVnode: MountedComponentVNode, vnode: MountedComponentVNode) {
    const options = vnode.componentOptions;
    const child = (vnode.componentInstance = oldVnode.componentInstance);
    updateChildComponent(
      child,
      options.propsData, // updated props
      options.listeners, // updated listeners
      vnode, // new parent vnode
      options.children // new children
    );
  },

  insert(vnode: MountedComponentVNode) {
    const { context, componentInstance } = vnode;
    if (!componentInstance._isMounted) {
      componentInstance._isMounted = true;
      callHook(componentInstance, "mounted");
    }
    if (vnode.data.keepAlive) {
      if (context._isMounted) {
        // vue-router#1212
        // During updates, a kept-alive component's child components may
        // change, so directly walking the tree here may call activated hooks
        // on incorrect children. Instead we push them into a queue which will
        // be processed after the whole patch process ended.
        queueActivatedComponent(componentInstance);
      } else {
        activateChildComponent(componentInstance, true /* direct */);
      }
    }
  },

  destroy(vnode: MountedComponentVNode) {
    const { componentInstance } = vnode;
    if (!componentInstance._isDestroyed) {
      if (!vnode.data.keepAlive) {
        componentInstance.$destroy();
      } else {
        deactivateChildComponent(componentInstance, true /* direct */);
      }
    }
  },
};

const hooksToMerge = Object.keys(componentVNodeHooks);

/**
 * 创建组件VNode
 * 1. 函数式组件通过执行其 render 方法生成组件的VNode
 * 2. 普通组件通过 new VNode() 生成其Vnode, 但是普通组件有一个重要操作是在 data.hook 对象上设置了四个钩子函数，
 *    分别是 init, prepatch, insert, destroy 在组件的patch阶段会被调用
 *    比如：init方法，调用时会进入子组件实例的创建挂载阶段，直至完成渲染
 * @param {*} Ctor 组件构造函数
 * @param {*} data 属性组成的 JSON 字符串
 * @param {*} context 上下文
 * @param {*} children 子节点数组
 * @param {*} tag 标签名
 * @returns
 */
export function createComponent(
  Ctor: Class<Component> | Function | Object | void,
  data: ?VNodeData,
  context: Component,
  children: ?Array<VNode>,
  tag?: string
): VNode | Array<VNode> | void {
  //组件构造函数不存在，直接返回
  if (isUndef(Ctor)) {
    return;
  }

  // Vue.extend
  const baseCtor = context.$options._base;

  // 当 Ctor 为配置对象时，通过 Vue.extend 将其转化为构造函数
  // plain options object: turn it into a constructor
  if (isObject(Ctor)) {
    Ctor = baseCtor.extend(Ctor);
  }

  // 如果到这个阶段，Ctor仍然不是一个函数，则表示这是一个无效的组件
  // if at this stage it's not a constructor or an async component factory,
  // reject.
  if (typeof Ctor !== "function") {
    if (process.env.NODE_ENV !== "production") {
      warn(`Invalid Component definition: ${String(Ctor)}`, context);
    }
    return;
  }

  // 异步组件
  // async component
  let asyncFactory;
  if (isUndef(Ctor.cid)) {
    asyncFactory = Ctor;
    Ctor = resolveAsyncComponent(asyncFactory, baseCtor);
    if (Ctor === undefined) {
      // return a placeholder node for async component, which is rendered
      // as a comment node but preserves all the raw information for the node.
      // the information will be used for async server-rendering and hydration.
      return createAsyncPlaceholder(asyncFactory, data, context, children, tag);
    }
  }

  // 节点属性的json字符串
  data = data || {};

  // 这里其实就是组件做选项合并的地方，即编译器将组件编译为渲染函数，渲染时执行执行 render 函数，然后执行其中的 _c, 就走到这里了
  // 解析构造函数选项，合并基类选项，以防止组件构造函数创建后应用全局混入
  // resolve constructor options in case global mixins are applied after
  // component constructor creation
  resolveConstructorOptions(Ctor);

  // 将组件的 v-model 的信息，转换为 data.attrs 对象的属性，值和 data.on 对象上的事件，回调
  // transform component v-model data into props & events
  if (isDef(data.model)) {
    transformModel(Ctor.options, data);
  }

  // 提取 props 数据，得到propsData对象，propsData[key] = val
  // 以组件 props 配置中的属性为key,父组件中对应的数据为 value
  // extract props
  const propsData = extractPropsFromVNodeData(data, Ctor, tag);

  // 函数式组件
  // functional component
  if (isTrue(Ctor.options.functional)) {
    return createFunctionalComponent(Ctor, propsData, data, context, children);
  }

  // 获取事件监听器对象 data.on, 因为这些监听器需要作为子组件监听器处理，而不是DOM监听器
  // extract listeners, since these needs to be treated as
  // child component listeners instead of DOM listeners
  const listeners = data.on;
  // 将带有 .native 修饰符的事件对象赋值给 data.on
  // replace with listeners with .native modifier
  // so it gets processed during parent component patch.
  data.on = data.nativeOn;

  if (isTrue(Ctor.options.abstract)) {
    // abstract components do not keep anything
    // other than props & listeners & slot

    // work around flow
    const slot = data.slot;
    data = {};
    if (slot) {
      data.slot = slot;
    }
  }

  /**
   * 在组件的data对象上设置hook对象
   * hook对象增加四个属性：inint, prepatch, insert, destroy
   * 负责组件的创建，更新，销毁 这些方法在组件的 patch 阶段会被调用
   */
  // install component management hooks onto the placeholder node
  installComponentHooks(data);

  // return a placeholder vnode
  const name = Ctor.options.name || tag;
  // 实例化组件的 VNode, 对于普通组件的标签名会比比较特殊， `vue-component-${Ctor.cid}${name ? `-${name}` : ""}`
  const vnode = new VNode(
    `vue-component-${Ctor.cid}${name ? `-${name}` : ""}`,
    data,
    undefined,
    undefined,
    undefined,
    context,
    { Ctor, propsData, listeners, tag, children },
    asyncFactory
  );

  // Weex specific: invoke recycle-list optimized @render function for
  // extracting cell-slot template.
  // https://github.com/Hanks10100/weex-native-directive/tree/master/component
  /* istanbul ignore if */
  if (__WEEX__ && isRecyclableComponent(vnode)) {
    return renderRecyclableComponentTemplate(vnode);
  }

  return vnode;
}

export function createComponentInstanceForVnode(
  // we know it's MountedComponentVNode but flow doesn't
  vnode: any,
  // activeInstance in lifecycle state
  parent: any
): Component {
  const options: InternalComponentOptions = {
    _isComponent: true,
    _parentVnode: vnode,
    parent,
  };
  // check inline-template render functions
  const inlineTemplate = vnode.data.inlineTemplate;
  if (isDef(inlineTemplate)) {
    options.render = inlineTemplate.render;
    options.staticRenderFns = inlineTemplate.staticRenderFns;
  }
  return new vnode.componentOptions.Ctor(options);
}

function installComponentHooks(data: VNodeData) {
  const hooks = data.hook || (data.hook = {});
  for (let i = 0; i < hooksToMerge.length; i++) {
    const key = hooksToMerge[i];
    const existing = hooks[key];
    const toMerge = componentVNodeHooks[key];
    if (existing !== toMerge && !(existing && existing._merged)) {
      hooks[key] = existing ? mergeHook(toMerge, existing) : toMerge;
    }
  }
}

function mergeHook(f1: any, f2: any): Function {
  const merged = (a, b) => {
    // flow complains about extra args which is why we use any
    f1(a, b);
    f2(a, b);
  };
  merged._merged = true;
  return merged;
}

// 将组件的 v-model 的信息（值和回调）转换为 data.attrs 对象的属性、值和 data.on 对象上的事件、回调
// transform component v-model info (value and callback) into
// prop and event handler respectively.
function transformModel(options, data: any) {
  // model 的属性和事件，默认是 value和input
  const prop = (options.model && options.model.prop) || "value";
  const event = (options.model && options.model.event) || "input";
  // 在data.attrs 对象上存储 v-model 的值
  (data.attrs || (data.attrs = {}))[prop] = data.model.value;
  // 在data.on 对象上存储 v-model 的事件
  const on = data.on || (data.on = {});
  // 已存在的事件回调函数
  const existing = on[event];
  // v-model 中事件对应的回调函数
  const callback = data.model.callback;
  // 合并回调函数
  if (isDef(existing)) {
    if (
      Array.isArray(existing)
        ? existing.indexOf(callback) === -1
        : existing !== callback
    ) {
      on[event] = [callback].concat(existing);
    }
  } else {
    on[event] = callback;
  }
}
