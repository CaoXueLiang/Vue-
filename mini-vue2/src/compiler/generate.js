/**
 * 从 ast 生成渲染函数
 * @param {*} ast ast 对象
 * @returns 渲染函数
 */
export default function generate(ast) {
  // 渲染函数字符串形式
  const renderStr = genElment(ast);
  // 通过 new Function() 将字符串形式的函数变成可执行函数，并用 with 为渲染函数扩展作用域链
  return new Function(`with(this) { return ${renderStr} }`);
}

/**
 * 解析ast生成渲染函数
 * @param {*} ast
 * @returns 渲染函数的字符串形式
 */
function genElment(ast) {
  const { tag, rawAttr, attr } = ast;
  // 生成属性map对象，静态属性 + 动态属性
  const attrs = { ...rawAttr, ...attr };
  // 处理子节点，得到一个所有子节点渲染函数组成的数组
  const children = genChildren(ast);
  // 生成 vnode 的可执行方法
  return `_c('${tag}',${JSON.stringify(attrs)},[${children}])`;
}

/**
 * 处理ast节点的子节点，将子节点变成渲染函数
 * @param {*} ast 节点的ast对象
 * @returns [childNodeRender1,childNodeRender2,...]
 */
function genChildren(ast) {
  const ret = [];
  const { children } = ast;
  for (let index = 0; index < children.length; index++) {
    const child = children[index];
    if (child.type === 3) {
      // 文本节点
      ret.push(`_v(${JSON.stringify(child)})`);
    } else if (child.type === 1) {
      // 元素节点
      ret.push(genElment(child));
    }
  }
  return ret;
}
