/**
 * VNode类
 * @param {*} tag 标签名
 * @param {*} attr 属性Map对象
 * @param {*} children 子节点组成的 Node
 * @param {*} context Vue实例
 * @param {*} text 文本节点的ast对象
 * @returns
 */
export default function VNode(tag, attr, children, context, text = null) {
  return { tag, attr, parent: null, children, text, elm: null, context };
}
