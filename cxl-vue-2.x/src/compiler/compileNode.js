import compileAttribute from "./compileAttribute.js";
import compileTextNode from "./compileTextNode.js";
/**
 * 递归编译整颗节点树
 * @param {*} nodes 节点
 * @param {*} vm 实例
 */
export default function compileNode(nodes, vm) {
  for (let index = 0; index < nodes.length; index++) {
    const node = nodes[index];
    if (node.nodeType === 1) {
      //元素节点
      //编译元素上的属性节点
      compileAttribute(node, vm);
      //递归遍历子节点
      compileNode(Array.from(node.childNodes), vm);
    } else if (node.nodeType === 3 && node.textContent.match(/{{(.*)}}/)) {
      //编译文本节点
      compileTextNode(node, vm);
    }
  }
}
