import vnode from "./vnode";
import createElement from "./createElement";
import patchVnode from "./patchVnode";

//判断是否是同一个节点，选择器和key都相同才是同一节点
function sameNode(oldVnode, newVNode) {
  return oldVnode.sel === newVNode.sel && oldVnode.key === newVNode.key;
}

//虚拟dom`diff`比较
export default function patch(oldVnode, newVnode) {
  if (!oldVnode.sel) {
    //旧节点是dom节点，将其包装为虚拟节点
    oldVnode = vnode(
      oldVnode.tagName.toLowerCase(),
      {},
      undefined,
      undefined,
      oldVnode
    );
  }

  if (typeof newVnode === "object" && newVnode.hasOwnProperty("sel")) {
    if (sameNode(oldVnode, newVnode)) {
      patchVnode(oldVnode, newVnode);
    } else {
      //不是同一个节点，暴力删除旧的节点，插入新的节点
      oldVnode.elm.parentNode.insertBefore(
        createElement(newVnode),
        oldVnode.elm
      );
      oldVnode.elm.parentNode.removeChild(oldVnode.elm);
    }
  }
}
