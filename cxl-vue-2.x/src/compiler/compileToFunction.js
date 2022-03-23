import parse from "./parse.js";
import generate from "./generate.js";

/**
 * 将模板解析成 AST 抽象语法树，在将 AST 抽象语法树生成渲染函数
 * @param {*} template 模板字符串
 * @returns
 */
export default function compileToFunction(template) {
  // 解析模板生成 AST
  const ast = parse(template);
  // 将 AST 生成渲染函数
  const render = generate(ast);
  return render;
}
