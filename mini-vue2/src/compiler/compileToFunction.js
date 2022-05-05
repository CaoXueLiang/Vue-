import parse from "./parse.js";
import generate from "./generate.js";

/**
 * 1.解析模板得到 ast对象
 * 2.将 ast对象生成渲染函数
 * @param {*} template 模板字符串
 * @returns render函数
 */
export default function compileToFunction(template) {
  const ast = parse(template);
  const render = generate(ast);
  return render;
}
