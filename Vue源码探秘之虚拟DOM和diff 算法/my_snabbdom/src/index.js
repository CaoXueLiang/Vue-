import h from "./compoments/h";
import patch from "./compoments/patch";

const constain = document.getElementById("container");
const button = document.getElementById("tmpButton");

const myVnode1 = h("ul", {}, [
  h("li", { key: "A" }, "A"),
  h("li", { key: "B" }, "B"),
  h("li", { key: "C" }, "C"),
  h("li", { key: "D" }, "D"),
  h("li", { key: "E" }, "E"),
]);
patch(constain, myVnode1);

// 新节点
const myVnode2 = h("ul", {}, [
  h("li", { key: "Q" }, "Q"),
  h("li", { key: "T" }, "T"),
  h("li", { key: "B" }, "B"),
  h("li", { key: "A" }, "A"),
  h("li", { key: "N" }, "N"),
  h("li", { key: "Z" }, "Z"),
  h("li", { key: "M" }, "M"),
  h("li", { key: "C" }, "C"),
  h("li", { key: "D" }, "D"),
  h("li", { key: "E" }, "E"),
]);

button.onclick = function () {
  patch(myVnode1, myVnode2);
};
