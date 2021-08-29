import createElement from "./createElement";
import updateChidren from "./updateChidren";

export default function patchVnode(oldVnode, newVnode) {
  if (oldVnode === newVnode) {
    return;
  }
  if (newVnode.text && !newVnode.children) {
    //新节点是否有text属性
    if (newVnode.text !== oldVnode.text) {
      oldVnode.elm.innerText = newVnode.text;
    }
  } else if (newVnode.children && newVnode.children.length > 0) {
    //新节点有chidren属性
    if (oldVnode.children && oldVnode.children.length > 0) {
      //老节点有chidren属性 (新老节点都有chidren，这是最复杂的情况)
      updateChidren(oldVnode.elm, oldVnode.children, newVnode.children);
    } else if (oldVnode.text && !oldVnode.children) {
      //老节点有text属性
      oldVnode.elm.innerText = "";
      for (let index = 0; index < newVnode.children.length; index++) {
        const element = newVnode.children[index];
        oldVnode.elm.appendChild(createElement(element));
      }
    }
  }
}
