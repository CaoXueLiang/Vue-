import { observe } from "./compoments/index";
import Watcher from "./compoments/watcher";

/**
 * 对象的新增和删除属性，不会被监听到，只有对象本身存在的属性才能被劫持
 */

let normalObj = {
  name: "xiaoming",
  age: 20,
  sex: "women",
  favorite: [{ name: "嘿嘿" }, "骑行"],
  a: {
    b: "b1",
    c: "c1",
    d: {
      m: "m1",
      n: {
        q: "q1",
        favorite: {
          num1: "唱歌",
          num2: "游泳",
        },
      },
    },
  },
};

observe(normalObj);
// normalObj.age = 30;
// normalObj.name = "小丽";
// normalObj.a.b = "我是a.b";
// normalObj.a.d.m = "我是m";
// console.log(normalObj.a.d.n.favorite);
// normalObj.favorite.push("语文", "数学");
// normalObj.favorite.pop();
// normalObj.favorite.unshift("英语");
console.log(normalObj);

new Watcher(normalObj, "name", function (target, newValue, oldValue) {
  console.log(`----触发了watcher---- ${newValue}`);
});

new Watcher(normalObj, "a.b", function (target, newValue, oldValue) {
  console.log(`----触发了watcher---- ${newValue}`);
});

new Watcher(normalObj, "a.d.m", function (target, newValue, oldValue) {
  console.log(`----触发了watcher---- ${newValue}`);
});
normalObj.name = "小丽";
normalObj.a.b = "b222";
normalObj.a.d.m = "mmmmmmmmmmmm";
