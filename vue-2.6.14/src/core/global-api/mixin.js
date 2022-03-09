/* @flow */

import { mergeOptions } from "../util/index";

export function initMixin(Vue: GlobalAPI) {
  /**
   * 定义 vue.mixin 负责全局混入选项，影响之后所有创建的vue实例，这些实例会合并全部混入的选项
   * @param {*} mixin mixin Vue 配置对象
   * @returns 返回 Vue 实例
   */
  Vue.mixin = function (mixin: Object) {
    // 在vue的默认配置项上，合并 mixin 对象
    this.options = mergeOptions(this.options, mixin);
    return this;
  };
}
