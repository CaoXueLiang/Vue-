##### 一. Vue初始化过程都做了什么?（new Vue(options)）

1. 处理组件配置项：①对于根组件，将Vue的全局配置合并到根组件的局部配置上。比如将Vue.component注册的全局组件合并到根组件的component上。②对于子组件主要做了一些性能优化，将一些深层次的属性赋值到vm.$options属性上，提高执行效率。

2. 处理组件实例关系属性，比如：$parent，$children，$root，$refs

3. 初始化自定义事件，$on，$off，$once，$emite

4. 初始化渲染，解析组件的插槽信息，得到 vm.$slot。处理渲染函数，得到 vm.$createElement 方法，即h函数

5. 调用 beforeCreate 钩子函数

6. 处理 inject 配置项，得到 ret[key] = val 形式的配置对象，然后对该配置对象进行浅层的响应式处理，并代理每个key到vm实例上。

7. 初始化数据，对数据进行响应式处理 props,methods,data,computed,watcher

8. 解析组件配置项上的 provide 对象，将其挂载到 vm._provided属性上

9. 调用 created 钩子函数

10. 判断是否有 el 属性，则调用 vm.$mount方法，进入挂载阶段。

    

##### 二.  Vue 响应式原理是怎么实现的？

响应式的核心是通过 `Object.defineProperty` 拦截对数据的访问和设置

响应式数据分为两类：

* 对象，循环遍历对象的所有属性，为每个属性设置 getter、setter，以达到拦截访问和设置的目的，如果属性值依旧为对象，则递归属性上的key 设置 getter、setter
  1. 访问数据时进行依赖收集，在`dep`中存储相关的 `watcher`
  2. 设置数据时由`dep`通知相关的`watcher`去更新
* 数组，增强数组的7个可以改变自身的原型方法，然后拦截对这些方法的操作
  1. 添加新数据时也进行响应式处理，然后由`dep`通知`watcher`去更新
  2. 删除数据时，也要由`dep`通知 `watcher`去更新

`每个组件实例都对应一个 **watcher** 实例，它会在组件渲染的过程中把“接触”过的数据 property 记录为依赖。之后当依赖项的 setter 触发时，会通知 watcher，从而使它关联的组件重新渲染。`

![Snipaste_1123r](C:\Users\caoxu\Downloads\Snipaste_1123r.png)



##### 三. methods、computed 和 watch 有什么区别？

使用场景：

* methods 一般用于封装一些复杂的处理逻辑(同步，异步)
* computed 一般用于封装一些简单的同步逻辑。将经过处理的数据返回，显示在模板中，以减轻模板的重量
* watch 一般用于当监听数据的变化时执行异步和开销较大的操作

methods VS computed

> 通过示例会发现，如果在一次渲染中，有多个地方使用了同一个 methods 或 computed 属性，methods 会被执行多次，而 computed 的回调函数则只会被执行一次。

computed VS watch

>computed和watch本质上是一样的，内部都是通过Watcher来实现的，非要说区别的话就两点：
>
>1、使用场景上的区别，2、computed 默认是懒执行的，切不可更改。

methods VS watch

> methods 和 watch 之间其实没什么可比的，完全是两个东西，不过在使用上可以把 watch 中一些逻辑抽到 methods 中，提高代码的可读性。



##### 四.Vue 的异步更新机制是如何实现的？

 Vue的异步更新机制的核心是利用了浏览器的异步任务队列来实现的，首选微任务队列，宏任务次之。

当响应式数据更新后，会触发setter 执行 `dep.notify`方法，通知dep中收集的watcher去执行update方法，`watcher.update`将 watcher自己放入到一个watcher队列（全局queue数组）

然后通过 `nextTick` 方法将一个刷新watcher队列的函数（`flushSchedulerQueue`）放入一个全局的`callbacks`数组中。

如果此时浏览器的异步任务队列中没有一个叫`flushCallbacks` 的函数，则执行 timerFunc函数，将flushCallbacks函数放到异步任务队列。如果异步任务队列中已经存在`flushCallbacks`函数，等待其执行完成以后再放入下一个`flushCallbacks`函数函数。

`flushCallbacks`函数负责执行callbacks数组中的所有的`flushSchedulerQueue`函数

`flushSchedulerQueue`函数负责刷新watcher队列，即执行queue数组中的每一个watcher的`watcher.run`方法，从而进入更新阶段，比如执行组件更新函数`updateComponent`或者执行用户watcher的回调函数。

```js
//改变数据，通过debugger得到调用栈如下：
reactiveSetter --> dep.notify --> watcher.update --> queueWatcher --> nextTick --> timeFunc --> flushCallbacks --> flushSchedulerQueue --> watcher.run --> watcher.get --> updateComponent --> 进入patch阶段
```



##### 五.Vue 的 nextTick API 是如何实现的？

  Vue.nextTick 或者 vm.$nextTick 的原理其实很简单，就做了两件事：

* 将传递的回调函数用`try catch`包裹然后放入callbacks数组
* 执行`timerFunc`函数，将刷新`callbacks`数组的函数`flushCallbacks`放到浏览器的异步任务队列中















