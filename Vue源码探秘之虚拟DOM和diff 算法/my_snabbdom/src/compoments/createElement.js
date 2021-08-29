//将虚拟`vnode`，转化为真正的`dom`
export default function createElement(vnode) {
  const domNode = document.createElement(vnode.sel);
  if (vnode.text && !vnode.children) {
    //判断是文本
    domNode.innerText = vnode.text;
  } else if (vnode.children && vnode.children.length > 0) {
    //判断是数组
    for (let index = 0; index < vnode.children.length; index++) {
      const element = vnode.children[index];
      let tmpDom = createElement(element);
      domNode.appendChild(tmpDom);
    }
  }
  //补充elm属性
  vnode.elm = domNode;
  return domNode;
}
