import Watcher from "../observer/watcher.js";

/**
 * 编译节点属性
 * @param {*} node 节点
 * @param {*} vm 实例
 */
export default function compileAttribute(node, vm) {
  const attrs = Array.from(node.attributes);
  console.log(attrs);
  // 遍历属性数组
  for (const attr of attrs) {
    const { name, value } = attr;
    if (name.match(/v-on:click/)) {
      // 编译 v-on:click 指令
      compileVOnClick(node, value, vm);
    } else if (name.match(/v-bind:(.*)/)) {
      // 编译 v-bind 指令
      compileVBind(node, value, vm);
    } else if (name.match(/v-model/)) {
      // 编译 v-model 指令
      compileVModel(node, value, vm);
    }
  }
}

function compileVOnClick(node, method, vm) {
  node.addEventListener("click", function (...args) {
    vm.$options.methods[method].apply(vm, args);
  });
}

function compileVBind(node, attrValue, vm) {
  // 属性名称
  const attrName = RegExp.$1;
  // 移除模版中的 v-bind 属性
  node.removeAttribute(`v-bind:${attrName}`);
  // 当属性值发生变化时，重新执行回调函数
  function cb() {
    node.setAttribute(attrName, vm[attrValue]);
  }
  // 实例化 Watcher，当属性值发生变化时，dep 通知 watcher 执行 update 方法，cb 被执行，重新更新属性
  new Watcher(cb);
}

function compileVModel(node, key, vm) {
  // 节点标签名，类型
  let { tagName, type } = node;
  tagName = tagName.toLowerCase();
  if (tagName === "input" && type === "text") {
    // <input type="text" v-model="inputVal" />
    // 设置 input 输入框的初始值
    node.value = vm[key];
    // 给节点添加 input事件，当事件发生时改变响应式数据
    node.addEventListener("input", function () {
      vm[key] = node.value;
    });
  } else if (tagName === "input" && type === "checkbox") {
    // <input type="checkbox" v-model="isChecked" />
    node.checked = vm[key];
    node.addEventListener("change", function () {
      vm[key] = node.checked;
    });
  } else if (tagName === "select") {
    node.value = vm[key];
    node.addEventListener("change", function () {
      vm[key] = node.value;
    });
  }
}
