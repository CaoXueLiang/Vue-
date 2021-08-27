import {
  init,
  classModule,
  propsModule,
  styleModule,
  eventListenersModule,
  h,
} from "snabbdom";

const patch = init([
  // Init patch function with chosen modules
  classModule, // makes it easy to toggle classes
  propsModule, // for setting properties on DOM elements
  styleModule, // handles styling on elements with support for animations
  eventListenersModule, // attaches event listeners
]);

const container = document.getElementById("container");
const tmpButton = document.getElementById("tmpButton");

//h函数--用来创建vnode，接收三个参数。①标签/选择器作为字符串、②可选数据对象、 ③可选字符串或子数组。
/**
 * 如果数组中只有一个参数时，可以省略数组
 *  h("div", {}, [h("span", {}, "哈哈哈")]) === h("div", {}, h("span", {}, "哈哈哈"))
 */

//第三个参数是字符串
// const vnode1 = h("div", {}, "嘿嘿嘿");

//第三个参数是数组
const vnode1 = h("ul", {}, [
  h("li", { key: "a" }, "A"),
  h("li", { key: "b" }, "B"),
  h("li", { key: "3" }, "C"),
]);

//第三个参数多层嵌套`h`函数
// const vnode1 = h("ul", { key: "a" }, [
//   h("li", {}, "A"),
//   h("li", {}, "B"),
//   h("li", {}, [
//     h("div", {}, "嘿嘿"),
//     h("div", {}, "呵呵呵"),
//     h("div", {}, "哈哈哈哈"),
//   ]),
//   h("li", {}, "D"),
// ]);

console.log(vnode1);
patch(container, vnode1);

const newVnode = h("ul", {}, [
  h("li", { key: "a" }, "1111"),
  h("li", { key: "b" }, "B"),
  h("li", { key: "c" }, "C"),
  h("li", { key: "d" }, "D"),
]);

tmpButton.onclick = function () {
  patch(vnode1, newVnode);
};
