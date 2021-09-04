# Vue数据响应式原理

### 什么是响应式?

 Vue最独特的特性之一，是其非侵入性的响应式系统。当数据发生变化后，视图会重新更新。

  

### 如何追踪数据的变化

当把一个`JavaScript对象`传入Vue作为`data`的选项，Vue会遍历此对象上的所有属性。并使用 [`Object.defineProperty`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty) 把这些 property 全部转为 `getter/setter`。每个组件实例都对应一个 **watcher** 实例，它会在组件渲染的过程中把“接触”过的数据 property 记录为依赖。之后当依赖项的 setter 触发时，会通知 **watcher**，从而使它关联的组件重新渲染。

![vue响应式原理](https://i0.hdslb.com/bfs/album/7d4121643c125a82090362d84f06c994e99432e8.png)

#### 1.对象的监听

递归遍历对象的每个属性，通过`Object.defineProperty`将其转化为getter/setter，当组件访问数据时会触发`getter`函数，当修改数据时触发`setter`函数。

```javascript
export function defineReactive(obj, key, val) {
  if (arguments.length === 2) {
    val = obj[key];
  }
  Object.defineProperty(obj, key, {
    configurable: true,
    enumerable: true,
    set(newValue) {
      if (val === newValue) {
        return;
      }
      val = newValue;
    },
    get() {
      return val;
    },
  });
}
```

#### 2.数组的监听

![Snipaste_2021-09-04_18-37-50](https://i0.hdslb.com/bfs/album/d70763e82a55676ae1dd15ec5ef79ed45fda7abd.png)

对于数组通过`arrayMethods = Object.create(arrayproto);`已数组原型为原型创建arrayMethods对象，并重写数组的7个方法。这样就会覆盖其原型上方法。最后将数组实例的原型设置为`arrayMethods`   通过`Object.setPrototypeOf(*value*, arrayMethods);`。

```js
const arrayproto = Array.prototype;
export const arrayMethods = Object.create(arrayproto);

const methodsToPatch = [
  "push",
  "pop",
  "shift",
  "unshift",
  "splice",
  "sort",
  "reverse",
];

methodsToPatch.forEach(function (method) {
  //缓存的原方法
  const original = arrayproto[method];
  def(arrayMethods, method, function mutator(...args) {
    const result = original.apply(this, args);
    console.log(`-----监听数组的变化----${method}----${args}`);
    const ob = this.__ob__;
    //记录插入的元素，对插入的元素也要添加`Observe`
    let inserted;
    if (method === "push" || method === "unshift") {
      inserted = args;
    }
    if (method === "splice") {
      inserted = args.slice(2);
    }
    if (inserted) {
      ob.observeArray(inserted);
    }
    //通知改变
    ob.dep.notify();
    return result;
  });
});
```



到这里已经可以监听到数据的变化了，但是Vue源码数据监听也存在一些问题:

对象属性的添加和删除不能被监听到。

  Vue 不能检测以下数组的变动：

1. 当你利用索引直接设置一个数组项时，例如：`vm.items[indexOfItem] = newValue`
2. 当你修改数组的长度时，例如：`vm.items.length = newLength`



### 依赖收集

在`getter`中收集依赖，在`setter`中触发依赖。把依赖收集的代码封装成一个`Dep`类，它专门用来管理依赖。每个JavaScript对象中都有一个``Observer`实例，每个Observer实例中又有一个`Dep`实例。Dep实例中又包含多个`Watche`r实例。采用了发布订阅者模式。当数据发生改变后会发布通知，`Watcher`实例调用自己的`update`方法，通知关联的组件进行数据更新，通过虚拟Dom和diff算法进行页面的更新重新渲染。

```
javaScript对象 -> Observer实例 -> Dep实例 ->Watcher实例
```

Dep类：

```js
/**
 * 依赖收集/收集订阅者
 */
let uid = 0;
export default class Dep {
  constructor() {
    this.subs = [];
    this.id = uid++;
  }

  //添加订阅
  addSub(sub) {
    this.subs.push(sub);
  }

  //收集依赖
  depend() {
    //Dep.target就是我们自己指定的全局变量，使用window.target也行，只要全局唯一就行
    if (Dep.target) {
      this.addSub(Dep.target);
    }
  }

  notify() {
    for (let i = 0, l = this.subs.length; i < l; i++) {
      this.subs[i].update();
    }
  }
}
```

Watcher类：

```js
var uid = 0;
export default class Watcher {
  constructor(target, express, callback) {
    this.id = uid++;
    this.target = target;
    this.express = express;
    this.callback = callback;
    this.value = this.get();
  }

  update() {
    //当前对象,newValue,oldValue
    this.callback(
      this.target,
      this.parsePath(this.target, this.express),
      this.value
    );
  }

  get() {
    //进入依赖收集阶段，让全局的Dep.targer设置为这个watcher实例，进入依赖收集阶段
    Dep.target = this;
    let resultValue = this.parsePath(this.target, this.express); //触发`DefineProperty`get方法，触发依赖收集
    Dep.target = null;
    return resultValue;
  }

  parsePath(target, str) {
    let strArray = str.split(".");
    let result = strArray.reduce((pre, key) => {
      return pre[key];
    }, target);
    return result;
  }
}
```


