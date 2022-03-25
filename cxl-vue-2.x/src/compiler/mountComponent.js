import Watcher from "../observer/watcher.js";
import Vue from "../index.js";
export default function mountComponent(vm) {
  // 更新组件的函数
  const updateComponent = () => {
    vm._update(vm._render());
  };
  // 实例化一个渲染 Watcher，当响应式数据更新时，这个函数会被执行
  new Watcher(updateComponent);
}

/**
 * 负责执行 vm.$options.render 函数
 */
Vue.prototype._render = function () {
  // 给 render 函数绑定this上下文为Vue实例
  return this.$options.render.apply(this);
};

Vue.prototype._update = function (vnode) {
  //旧vnode
  const preVNode = this._vnode;
  //新vnode
  this._vnode = vnode;
  if (!preVNode) {
    //旧vnode不存在，则说明时首次渲染根组件
    this.$el = this.__patch__(this.$el, vnode);
  } else {
    //后续更新组件或者首次渲染子组件都会走这里
    this.$el = this.__patch__(preVNode, vnode);
  }
};
