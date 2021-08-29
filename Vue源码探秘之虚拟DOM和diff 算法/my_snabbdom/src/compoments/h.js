import vnode from "./vnode";
/**
  创建虚拟DOM,(目前只实现核心的东西，只考虑下面这三种情况)
  ① h('div',{},'哈哈哈');
  ② h('div'{},h('span',{},'嘿嘿'))
  ③ h('div',{},[
         h('span',{},'嘿嘿'),
         h('span',{},'呵呵'),
         h('span',{},'哈哈哈'),
      ])
 */
export default function h(sel, data, c) {
  if (typeof c === "string") {
    //di三个参数是文本格式
    return vnode(sel, data, undefined, c, undefined);
  } else if (typeof c === "object" && c.hasOwnProperty("sel")) {
    //第三个参数时`h`函数
    let children = [c];
    return vnode(sel, data, children, undefined, undefined);
  } else if (Array.isArray(c)) {
    //第三个参数是`h函数`数组
    return vnode(sel, data, c, undefined, undefined);
  }
}
