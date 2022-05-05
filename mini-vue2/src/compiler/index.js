import compileToFunction from "./compileToFunction.js";
/**
 * 编译器入口
 * 优先级：render > template > el
 */
export default function mount(vm) {
  // 如果没有提供 render 选项，则编译生成 render 函数
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

    // 生成渲染函数，将渲染函数挂载到 $options 上
    const render = compileToFunction(template);
    vm.$options.render = render;
    console.log(vm.$options.render);
  }
}
