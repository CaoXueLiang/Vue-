import initData from "./initData.js";
import mount from "./compiler/index.js";

/**
 * Vue构造函数
 * @param {*} options
 */
export default function Vue(options) {
  this._init(options);
}

Vue.prototype._init = function (options) {
  // 将options挂载到vue实例上
  this.$options = options;
  // 初始化data （1.将data上的属性代理到vue实例上，2.对data上的属性设置响应式）
  initData(this);
  // 如果存在 el 配置项，则调用 $mount 方法编译模版
  if (this.$options.el) {
    this.$mount();
  }
};

Vue.prototype.$mount = function () {
  mount(this);
};
