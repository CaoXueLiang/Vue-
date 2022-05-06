import Vue from "../index.js";
import Watcher from "../observer/watcher.js";

/**
 * 初始渲染
 * @param {*} vm
 */
export default function mountComponent(vm) {
  // 更新组件的函数
  const updateComponent = () => {
    vm._update(vm._render());
  };
  // 实例化一个watcher,当响应式数据更新时，这个更新函数会被执行
  new Watcher(updateComponent);
}

/**
 * 负责执行 vm.$options.render 函数
 */
Vue.prototype._render = function () {
  // 给 render 函数绑定 this上下文为 Vue实例
  return this.$options.render.apply(this);
};

Vue.prototype._update = function (vnode) {
  // 老的vnode
  const preVnode = this._vnode;
  // 新的vnode
  this._vnode = vnode;
  if (!preVnode) {
    // 老的 vnode 不存在，则说明是首次渲染根组件
    this.$el = this.__patch__(this.$el, vnode);
  } else {
    // 后续更新组件或者首次渲染子组件，都会走这里
    this.$el = this.__patch__(preVnode, vnode);
  }
};
