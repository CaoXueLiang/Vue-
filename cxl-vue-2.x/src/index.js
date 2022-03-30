import initData from "./initData.js";
import mount from "./compiler/index.js";
import renderHelper from "./compiler/renderHelper.js";
import patch from "./compiler/patch.js";
import initComputed from "./initComputed.js";

// Vue 构造函数
export default function Vue(options) {
  this._init(options);
}

Vue.prototype._init = function (options) {
  this.$options = options;
  initData(this);
  //初始化 computed 选项，并将计算属性代理到Vue实例上
  //结合 watcher 实现缓存
  initComputed(this);
  //安装渲染工具函数
  renderHelper(this);
  //在实例上安装`patch`函数
  this.__patch__ = patch;
  // 如果存在 el 配置项，则调用 $mount 方法编译模版进行挂载
  if (this.$options.el) {
    this.$mount();
  }
};

Vue.prototype.$mount = function () {
  mount(this);
};
