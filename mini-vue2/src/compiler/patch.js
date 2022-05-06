import Vue from "../index.js";
import { isReserveTag } from "../utils/index.js";

/**
 * 初始化渲染和后续更新的入口
 * @param {*} oldVnode 老的节点
 * @param {*} vnode 新的节点
 * @returns VNode的真实 DOM 节点
 */
export default function patch(oldVnode, vnode) {
  if (oldVnode && !vnode) {
    // 老节点存在，新节点不存在，则销毁组件
    return;
  }

  if (!oldVnode) {
    // oldVnode 不存在，则说明是子组件首次渲染
    createElm(vnode);
  } else {
    if (oldVnode.nodeType) {
      // 真实节点，则表示首次渲染根组件
      // 父节点，即body
      const parent = oldVnode.parentNode;
      // 参考节点，即老的vnode的下一个节点 --script, 新节点要插在 script 的前面
      const referNode = oldVnode.nextSibling;
      // 创建元素
      createElm(vnode, parent, referNode);
      // 移除老的真实dom
      parent.removeChild(oldVnode);
    } else {
      // 后续的更新都走这里，不管是根组件还是子组件
      patchVnode(oldVnode, vnode);
    }
  }
  return vnode.elm;
}

/**
 * 创建元素
 * @param {*} vnode
 * @param {*} parent
 * @param {*} referNode
 */
function createElm(vnode, parent, referNode) {
  // 记录节点的父节点
  vnode.parent = parent;
  // 创建自定义组件，如果是非组件，则会继续后面的流程
  if (createComponent(vnode)) {
    return;
  }

  const { attr, children, text } = vnode;
  if (text) {
    //❗走到这里说明是文本节点
    // 创建文本节点，并插入到父节点内
    vnode.elm = createTextNode(vnode);
  } else {
    //❗走到这里说明是元素节点
    // 创建元素，在vnode上记录对应的dom节点
    vnode.elm = document.createElement(vnode.tag);
    // 给元素设置属性
    setAttribute(attr, vnode);
    // 递归创建子节点
    for (let index = 0, len = children.length; index < len; index++) {
      createElm(children[index], vnode.elm);
    }
  }
  // 如果存在 parent, 则将创建的节点插入到父节点内
  if (parent) {
    const elm = vnode.elm;
    if (referNode) {
      parent.insertBefore(elm, referNode);
    } else {
      parent.appendChild(elm);
    }
  }
}

/**
 * 创建文本节点
 * @param {*} textVnode 文本节点的vnode
 */
function createTextNode(textVnode) {
  let { text } = textVnode;
  let textNode = null;
  if (text.expression) {
    // 存在表达式，这个表达式的值是一个响应式数据 `value = vm[key]`
    const value = textVnode.context[text.expression];
    textNode = document.createTextNode(
      typeof value === "object" ? JSON.stringify(value) : String(value)
    );
  } else {
    // 纯文本
    textNode = document.createTextNode(text.text);
  }
  return textNode;
}

/**
 * 给节点设置属性
 * 遍历属性，如果是普通属性直接设置，如果是指令则特殊处理
 * @param {*} attr 属性Map对象
 * @param {*} vnode
 */
function setAttribute(attr, vnode) {
  for (const name in attr) {
    if (name === "vModel") {
      // v-model指令
      const { tag, value } = attr.vModel;
      setVModel(tag, value, vnode);
    } else if (name === "vBind") {
      // v-bind指令
      setVBind(vnode);
    } else if (name === "vOn") {
      // v-on指令
      setVOn(vnode);
    } else {
      // 普通属性
      vnode.elm.setAttribute(name, attr[name]);
    }
  }
}

/**
 * v-model原理
 * @param {*} tag
 * @param {*} value
 * @param {*} vnode
 */
function setVModel(tag, value, vnode) {
  const { context: vm, elm } = vnode;
  if (tag === "select") {
    // 下拉框 <select></select>
    Promise.resolve().then(() => {
      // 利用微任务延迟设置，直接设置不行，因为这会儿 option 元素还没创建
      elm.value = vm[value];
    });
    elm.addEventListener("change", function () {
      vm[value] = elm.value;
    });
  } else if (tag === "input" && vnode.elm.type === "text") {
    // 文本框 <input type="text" />
    elm.value = vm[value];
    elm.addEventListener("input", function () {
      vm[value] = elm.value;
    });
  } else if (tag === "input" && vnode.elm.type === "checkbox") {
    // 选择框 <input type="checkbox" />
    elm.checked = vm[value];
    elm.addEventListener("change", function () {
      vm[value] = elm.checked;
    });
  }
}

/**
 * v-bind原理
 * @param {*} vnode
 */
function setVBind(vnode) {
  const {
    attr: { vBind },
    elm,
    context: vm,
  } = vnode;
  for (const attrName in vBind) {
    elm.setAttribute(attrName, vm[vBind[attrName]]);
    elm.removeAttribute(`v-bind:${attrName}`);
  }
}

/**
 * v-on原理
 * @param {*} vnode
 */
function setVOn(vnode) {
  const {
    attr: { vOn },
    elm,
    context: vm,
  } = vnode;
  for (const eventName in vOn) {
    elm.addEventListener(eventName, function (...args) {
      vm.$options.methods[vOn[eventName]].apply(vm, args);
    });
  }
}

/**
 * 创建自定义组件
 * @param {*} vnode
 */
function createComponent(vnode) {
  // 非平台保留标签，则说明是组件
  if (vnode.tag && !isReserveTag(vnode.tag)) {
    // 获取组件配置信息
    const {
      tag,
      context: {
        $options: { components },
      },
    } = vnode;
    const compOptions = components[tag];
    const compIns = new Vue(compOptions);
    // 将父组件的vnode放到子组件的实例上
    compIns._parentVnode = vnode;
    // 挂载子组件
    compIns.$mount();
    // 记录子组件 vnode 的父节点信息
    compIns._vnode.parent = vnode.parent;
    // 将子组件添加到父节点内
    vnode.parent.appendChild(compIns._vnode.elm);
    return true;
  }
}

/**
 * 对比新旧节点，找出其中的不同，然后更新老节点
 * @param {*} oldVnode
 * @param {*} vnode
 */
function patchVnode(oldVnode, vnode) {
  // 如果新老节点相同，则直接结束
  if (oldVnode === vnode) {
    return;
  }

  // 将旧vnode上的真实节点同步到新的vnode上，否则后续更新的时候会出现 vnode.elm 为空的情况
  vnode.elm = oldVnode.elm;

  // 走到这里说明新老节点不一样，则获取它们的孩子节点，比较孩子节点
  const newChildren = vnode.children;
  const oldChidren = oldVnode.children;

  if (!vnode.text) {
    //❗新节点不存在文本节点
    if (newChildren && oldChidren) {
      // diff
      updateChildren(newChildren, oldChidren);
    } else if (newChildren) {
      // 新节点有孩子节点,老节点没孩子节点。则增加孩子节点
    } else {
      // 新节点没孩子节点，老节点有孩子节点。则删除这些孩子节点
    }
  } else {
    //❗新节点存在文本节点
    if (vnode.text.expression) {
      // 获取表达式的值
      const value = JSON.stringify(vnode.context[vnode.text.expression]);
      try {
        const oldVlaue = oldVnode.elm.textContent;
        if (value !== oldVlaue) {
          // 新老值不一样，则更新
          oldVnode.elm.textContent = value;
        }
      } catch {
        // 防止更新时遇到插槽，导致报错
        // 目前不处理插槽数据的响应式更新
      }
    }
  }
}

/**
 * 更新子节点（对比孩子节点，找出不同点，然后将不同点更新到旧的真实DOM上）
 * @param {*} newCh
 * @param {*} oldCh
 */
function updateChildren(newCh, oldCh) {
  // 定义4个游标
  let newStartIdx = 0;
  let newEndIdx = newCh.length - 1;
  let oldStartIdx = 0;
  let oldEndIdx = oldCh.length - 1;

  // 遍历新老节点，找出节点中不一样的地方，然后更新
  while (newStartIdx <= newEndIdx && oldStartIdx <= oldEndIdx) {
    const newStartNode = newCh[newStartIdx];
    const newEndNode = newCh[newEndIdx];
    const oldStartNode = oldCh[oldStartIdx];
    const oldEndNode = oldCh[oldEndIdx];

    // 根据web中 DOM 的操作特点，做了4中假设，降低事件复杂度
    // 1.新前旧前 2.新后旧后 3.新后旧前 4.新前旧后
    if (sameVnode(newStartNode, oldStartNode)) {
      patchVnode(oldStartNode, newStartNode);
      newStartIdx++;
      oldStartIdx++;
    } else if (sameVnode(newEndNode, oldEndNode)) {
      patchVnode(oldEndNode, newEndNode);
      newEndIdx--;
      oldEndIdx--;
    } else if (sameVnode(newEndNode, oldStartNode)) {
      patchVnode(oldStartNode, newEndNode);
      //涉及到移动节点，将老开始节点移动到新结束的位置
      oldStartNode.elm.parentNode.insertBefore(
        oldStartNode.elm,
        oldCh[newEndIdx].elm.nextSibling
      );
      oldStartIdx++;
      newEndIdx--;
    } else if (sameVnode(newStartNode, oldEndNode)) {
      patchVnode(oldEndNode, newStartNode);
      //涉及到移动节点，将老结束节点移动到新开始的位置
      oldEndNode.elm.parentNode.insertBefore(
        oldEndNode.elm,
        oldCh[newStartIdx].elm
      );
      newStartIdx++;
      oldEndIdx--;
    } else {
      // 上面几种假设都没命中，则老老实实的遍历，找到新节点在旧节点数组中的位置
    }

    // 跳出循环，说明有一个节点首先遍历结束了
    if (newStartIdx > newEndIdx) {
      // 说明新节点先遍历完，则将剩余的老节点从 DOM中删除掉
    }

    if (oldStartIdx > oldEndIdx) {
      // 说明旧节点先遍历完，则将剩余的新节点添加到 DOM中
    }
  }
}

/**
 * 判断两个节点是否相同
 * 这里只做简单比较，只做了 key 和标签的比较
 * @param {*} node1
 * @param {*} node2
 */
function sameVnode(node1, node2) {
  return node1.key == node2.key && node1.tag == node2.tag;
}
