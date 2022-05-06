import VNode from "./vnode.js";
/**
 * 在Vue实例上安装运行时的渲染帮助函数，比如：_c、_v,这些函数会生成VNode
 * @param {*} target Vue实例
 */
export default function renderHelper(target) {
  target._c = createElement;
  target._v = createTextNode;
  target._t = renderSlot;
}

/**
 * 根据标签信息创建Vnode
 * @param {*} tag 标签名
 * @param {*} attr 标签的属性 Map对象
 * @param {*} children 所有子节点的渲染函数
 * @returns
 */
function createElement(tag, attr, children) {
  return VNode(tag, attr, children, this);
}

/**
 * 生成文本节点的VNode
 * @param {*} textAst 文本节点的AST对象
 * @returns
 */
function createTextNode(textAst) {
  return VNode(null, null, null, this, textAst);
}

/**
 * 生成插槽的 VNode
 * @param {*} attrs 插槽的属性
 * @param {*} children 插槽的所有子节点的 ast 组成的数组
 */
function renderSlot(attrs, children) {
  // 父组件VNode的 attr 信息
  const parentAttr = this._parentVnode.attr;
  let vnode = null;
  if (parentAttr.scopedSlots) {
    // 1、说明给当前组件的插槽传递了内容
    // 获取插槽信息
    const slotName = attrs.name;
    const slotInfo = parentAttr.scopedSlots[slotName];
    // 这里比较绕，可以打开调试查看数据结构，理清思路
    // 这里比较绕的逻辑完全是为了实现插槽这个功能，和插槽本身的原理没关系
    this[slotInfo.scopeSlot] = this[Object.keys(attrs.vBind)[0]];
    vnode = genVNode(slotInfo.children, this);
  } else {
    // 2、插槽默认内容
    // 将children 变成 vnode 数组
    vnode = genVNode(children, this);
  }

  // 如果children 长度为1，则说明插槽只有一个节点
  if (children.length === 1) {
    return vnode[0];
  }

  return createElement.call(this, "div", {}, vnode);
}

/**
 * 将一批ast节点(数组) 转化为vnode数组
 * @param {*} childs 节点数组
 * @param {*} vm 组件实例
 */
function genVNode(childs, vm) {
  const vnode = [];
  for (let index = 0; index < childs.length; index++) {
    const { tag, attr, children, text } = childs[index];
    if (text) {
      //一.是文本节点
      if (typeof text === "string") {
        // text为字符串
        const textAst = {
          type: 3,
          text,
        };
        const result = text.match(/{{(.*)}}/);
        if (result) {
          textAst.expression = result[1].trim();
        }
        vnode.push(createTextNode.call(vm, textAst));
      } else {
        // text为文本节点的 ast 对象
        vnode.push(createTextNode.call(vm, text));
      }
    } else {
      //二.是元素节点
      vnode.push(createElement.call(vm, tag, attr, genVNode(children, vm)));
    }
  }
  return vnode;
}
