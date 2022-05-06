/**
 * VNode
 * @param {*} tag 标签名
 * @param {*} attr 属性Map对象
 * @param {*} children children子节点组成的VNode
 * @param {*} context Vue实例
 * @param {*} text 文本节点AST对象
 * @returns
 */
export default function VNode(tag, attr, children, context, text = null) {
  return {
    tag,
    attr,
    parent: null,
    children,
    text,
    elm: null, //VNode的真实节点
    context,
  };
}
