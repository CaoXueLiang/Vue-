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

![Snipaste_1123r](https://s3.bmp.ovh/imgs/2022/04/29/9a8c34bf31bd139c.png)



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

  

##### 六.Vue.use(plugin) 做了什么？

负责安装plugin插件，其实就是执行插件提供的`install`方法。

* 首先判断该插件是否已经安装过，如果安装过则直接返回
* 如果没有，则执行插件提供的`install`方法安装插件，具体做什么由插件自己决定



##### 七.Vue.mixin(options) 做了什么？

负责在Vue的全局配置上合并options配置。

* 标准化 `options` 对象上的 `props`、`inject`、`directive` 选项的格式
* 处理 options 上的`extends` 和 `mixins`，分别将他们合并到全局配置上
* 然后将 options 配置和全局配置进行合并，选型冲突时 options 配置会覆盖全局配置



##### 八.Vue.component(compName, Comp) 做了什么？

负责注册全局组件。其实就是将组件配置注册到全局配置的 components 选项上（this.options.components）,

然后各个子组件在生成vnode时会将全局的components选项合并到局部的components配置项上。

* 如果第二个参数为空，则表示获取 compName的组件构造函数
* 如果 Comp 是组件配置对象，则使用`Vue.extend` 方法得到组件构造函数，否则直接进行下一步
* 在全局配置项上设置组件信息，`this.options.components.compName` = 组件构造函数



##### 九.Vue.directive('my-directive', {xx}) 做了什么？

在全局注册自定义指令，然后在每个子组件生成vnode时会将全局的`directives`选项合并到局部的`directives`选项中。原理同Vue.component方法：

* 如果第二个参数为空，则获取指定指令的配置对象

* 如果不为空，如果第二个参数是一个函数的话，则生成配置对象 `{bind:第二个参数，update:第二个参数}`

* 然后将指令配置对象设置到全局配置上，`this.options.directives['my-directive'] = {xx}`

  

##### 10.Vue.filter('my-filter',function(val){xxx})做了什么？

负责在全局注册过滤器，然后在每个子组件生成vnode时将全局的`filters`选项合并到局部的`filters`选项中。原理是：

* 如果没有提供第二个参数，则获取my-filter过滤器的回调函数
* 如果提供了第二个参数，则设置``this.options.filters['my-filter'] = function(val) {xxx}``



##### 11.Vue.extend(options) 做了什么？

`Vue.extend`基于Vue创建一个子类, 参数 options 会作为该子类的默认全局配置，就像Vue的默认全局配置一样。

所以通过`Vue.extend`扩展一个子类，一大用处就是内置一些公共配置，供子类的子类使用。

* 定义子类构造函数，这里和Vue构造函数一样，也是调用``_init(options)``
* 合并Vue配置项和options，如果选项冲突，则options的选项会覆盖Vue的配置项
* 给子类定义全局API，值为Vue的全局API，比如 Sub.extend = Super.extend, 这样子类同样可以扩展出其他子类
* 返回子类 Sub



##### 12.Vue.set(target, key, val) 做了什么?

通过Vue.set为响应式对象添加一个property,可以确保这个新的property同样是响应式的，且触发视图更新。

* 更新数组下标的元素：Vue.set(array,idx,val)，内部通过splice方法实现响应式更新
* 更新对象已有属性：Vue.set(obj,key,val)，直接更新即可 => obj[key]=val
* 不能向Vue实例或其根$data上动态的添加响应式属性
* Vue.set(obj,key,val) 如果obj不是响应式对象，会执行obj[key]=val，但是不会做响应式处理
* Vue.set(obj,key,val) 为响应式对象obj增加一个新的key, 则通过defineReactive 方法设置响应式，并触发依赖更新



##### 13.Vue.delete(target, key) 做了什么？

* 如果target为数组，则通过splice方法删除指定下标的元素
* 如果target为对象，则通过 `delete target[key]` 方法删除对象上的元素，并通过 `ob.dep.notifity`触发依赖更新



##### 14.Vue.nextTick(cb) 做了什么？

Vue.nextTick函数的作用是延迟回调函数cb的执行，一般用于 this.key = newVal 更新数据后，想立即获取更新后的Dom数据。

```javascript
this.key = newVal;
Vue.nextTick(()={
  // 在这里获取更新后的Dom
})
```

其内部执行过程是：

* 数据发生改变后，触发setter执行``dep.notifity()``。dep通知收集的所有watcher执行``watcher.update`方法，将watcher放到watcher队列
* 将刷新watcher队列的函数 `flushSchedulerQuene` 放到callbacks数组中
* 将刷新callbacks数组的函数 `flushCallbacks` 放到浏览器的异步任务队列
* **``Vue.nextTick(cb)``** 来插队，将cb函数放到callbacks数组
* 待将来某个是个执行刷新callbacks数组的函数
* 然后执行callbacks数组中的众多函数，触发watcher.run的执行，更新Dom
* 由于cb函数是在后面放到callbacks数组的，所以这就保证了先更新完DOM，在执行cb函数



##### 15.什么是 Hook Event？

`Hook Event` 是Vue的自定义事件结合生命周期钩子函数实现的一种从组件外部为组件注入额外生命周期方法的功能。



##### 16.Hook Event 是如果实现的？

```javascript
 <my-button @hook:mounted="hootMounted" @hook:created="hootCreated" />
```

* 处理自定义事件的时候（`vm.$on`) 如果发现组件有 `hook:xx` 格式的事件（xx为Vue的生命周期函数），则将`vm._hasHookEvent` 设置为 true，表示该组件上有 HookEvent
* 在组件生命周期方法被触发的时候，内部会通过`callHook`方法来执行这些生命周期函数，在生命周期函数执行之后，如果发现 `vm._hasHookEvent为true`，则表示当前组件有HookEvent，通过`vm.$emit('hook:xx')`触发Hook Event的执行

这就是**HookEvent** 的实现原理。



##### 17.简单说一下 Vue 的编译器都做了什么？

Vue的编译器做了三件事：

* **解析：**将html模板解析成 AST对象

* **优化：** 遍历AST对象，为每个节点做静态标记，标记其是否为静态节点，然后进一步标记出静态根节点。 （这样在后续更新过程中就可以跳过这些静态节点了，标记静态根节点用于生成渲染函数阶段，生成静态根节点的渲染函数）

* **生成渲染函数**：从AST生成渲染函数，即大家说的`render`，其实还有一个，就是 `staticRenderFns` 数组，里面存放了所有的静态节点的渲染函数

  

##### 18.详细说一下静态标记的过程？

* 标记静态节点

  * 通过递归的方式标记所有的元素节点
  * 如果节点本身是静态节点，但是存在非静态的子节点，则将节点修改为非静态节点

* 标记静态根节点，基于静态节点，进一步标记静态根节点

  * 如果节点本身是静态节点 && 有子节点 && 子节点不只是一个文本节点，则标记为静态根节点

    ```javascript
     if (
          node.static &&
          node.children.length &&
          !(node.children.length === 1 && node.children[0].type === 3)
        ) {
          // 节点本身是静态节点，而且有子节点，并且节点不只是一个文本节点，则标记为静态根节点
          node.staticRoot = true;
          return;
        } else {
          node.staticRoot = false;
        }
    ```

  * 如果节点本身不是静态根节点，则递归遍历所有子节点，在子节点中标记静态根节点



##### 19.什么样的节点才可以被标记为静态节点？

* 文本节点
* 节点上没有 v-bind、v-for、v-if等指令
* 非组件



##### 20.详细说一下渲染函数的生成过程？

说到渲染函数，基本上说的就是 `render` 函数，其实编译器生成的渲染函数有两类：

* 第一类就是`render`函数，负责生成动态节点的vnode
* 第二类是放在一个叫 `staticRenderFns` 数组中的静态渲染函数，这些函数负责生成静态节点的vnode

渲染函数生成的过程，其实就是遍历AST节点，通过递归的方式，处理每个节点，最后生成形如：`_c(tag, attr, children, normalizationType)`  的结果。tag是标签名，attr是属性对象，children是子节点组成的数组，其中每个元素的格式都是`_c(tag, attr, children, normalizationType)` 的形式，normalizationType 表示节点的规范化类型，不重要。

在处理AST节点的过程中需要重点关注也是面试中常见的问题有：

1、静态节点是怎么处理的？

静态节点的处理分为两步：

* 将生成的静态节点vnode函数放到 `staticRenderFns` 数组中
* 返回一个` _m(idx)`的可执行函数，意思是执行`staticRenderFns`数组中下标为idx的函数，生成静态节点的vnode

2、v-once、v-if、v-for、组件 等都是怎么处理的

* 单纯的 v-once 节点处理方式和静态节点一致
* v-if节点的处理结果是一个三元表达式
* v-for 节点的处理结果是可执行的 _l 函数，该函数负责生成 v-for 节点的vnode
* 组件的处理结果和普通元素一样，得到的是形如：`_c(compName)` 的可执行代码，生成组件的vnode













