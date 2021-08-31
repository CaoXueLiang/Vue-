let object1 = {};
Object.defineProperty(object1, "name", {
  value: "xiaohong",
  enumerable: true,
  writable: true,
  configurable: true,
});
Object.defineProperty(object1, "age", {
  value: 18,
  enumerable: true,
  writable: true,
});

object1.name = "lining";
console.log(object1);

//--------------------------------------------
let object2 = {};
let tmpVlaue = "";
Object.defineProperty(object2, "name", {
  enumerable: true,
  configurable: true,
  set(newValue) {
    tmpVlaue = newValue;
  },
  get() {
    return tmpVlaue;
  },
});
object2.name = "xiaoming";
console.log(object2.name);
console.log(object2);
