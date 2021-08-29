import h from "./compoments/h";
import patch from "./compoments/patch";

const constain = document.getElementById("container");
const button = document.getElementById("tmpButton");
constain.innerText = "我是contain";

let vnode1 = h("div", { key: "a" }, "呵呵呵呵呵");
patch(constain, vnode1);

let vnode2 = h("div", { key: "a" }, [
  h("div", {}, "哈哈哈"),
  h("div", {}, "哈哈哈"),
  h("div", {}, "哈哈哈"),
]);
console.log(vnode2);

// let vnode3 = h("div", {}, [
//   h("span", {}, "哈哈哈"),
//   h("span", {}, "嘿嘿嘿"),
//   h("span", {}, "呵呵"),
// ]);
// console.log(vnode3);

// let vnode4 = h("div", {}, [
//   h("span", {}, "哈哈哈"),
//   h("span", {}, [h("div", {}, "A"), h("div", {}, "B"), h("div", {}, "C")]),
//   h("span", {}, "呵呵"),
// ]);
// console.log(vnode4);

button.onclick = function () {
  patch(vnode1, vnode2);
};
