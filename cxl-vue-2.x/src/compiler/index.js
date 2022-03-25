import compileToFunction from "./compileToFunction.js";
import mountComponent from "./mountComponent.js";

/**
 * 编译器
 * @param {实例} vm
 */
export default function mount(vm) {
  // 没有提供 render 选项，则编译生成 render 函数
  if (!vm.$options.render) {
    let template = "";
    if (vm.$options.template) {
      // 模板存在
      template = vm.$options.template;
    } else if (vm.$options.el) {
      // 存在挂载点
      template = document.querySelector(vm.$options.el).outerHTML;
      // 在实例上记录挂载点，this._update 中会用到
      vm.$el = document.querySelector(vm.$options.el);
    }

    // 根据`template`模板,生成渲染函数
    const render = compileToFunction(template);
    // 将渲染函数挂载到 vm.$options 上
    vm.$options.render = render;

    console.log(vm.$options.render);
  }

  mountComponent(vm);
}
