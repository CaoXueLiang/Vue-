/**
 * Vue 构造函数
 * @param {*} options
 */
export default function Vue(options) {}

Vue.prototype._init = function (options) {
  this.$options = options;
  initData(this);
};

window.Vue = Vue;
