/* @flow */

import { toNumber, toString, looseEqual, looseIndexOf } from "shared/util";
import { createTextVNode, createEmptyVNode } from "core/vdom/vnode";
import { renderList } from "./render-list";
import { renderSlot } from "./render-slot";
import { resolveFilter } from "./resolve-filter";
import { checkKeyCodes } from "./check-keycodes";
import { bindObjectProps } from "./bind-object-props";
import { renderStatic, markOnce } from "./render-static";
import { bindObjectListeners } from "./bind-object-listeners";
import { resolveScopedSlots } from "./resolve-scoped-slots";
import { bindDynamicKeys, prependModifier } from "./bind-dynamic-keys";

/**
 * 在实例上挂载简写的`渲染工具函数`，这些都是运行时代码
 * 这些工具函数在编译器生成渲染函数中被用到了
 * @param {*} target
 */
export function installRenderHelpers(target: any) {
  //v-once 为Vnode加上打上静态标记
  target._o = markOnce;
  // 将值转换为数字
  target._n = toNumber;
  // 将值转换为字符串形式，普通值 => String(val), 对象 => JSON.stringify(val)
  target._s = toString;
  //v-for 渲染列表的帮助函数，循环遍历Val值，依次执行每一项render方法生成VNode,最终返回一个VNode数组
  target._l = renderList;
  //v-slot 插槽相关
  target._t = renderSlot;
  target._q = looseEqual;
  target._i = looseIndexOf;
  //运行时负责生成静态树的 VNode 的帮助程序, 完成以下两件事：
  // 1. 执行 staticRenderFns 数组中指定下标的渲染函数，生成静态树的Vnode并缓存，下次在渲染时从缓存中直接读取（isInFor 必须为 false）
  // 2. 为静态树的 vnode 打静态标记
  target._m = renderStatic;
  target._f = resolveFilter;
  target._k = checkKeyCodes;
  target._b = bindObjectProps;
  //为文本节点创建 VNode
  target._v = createTextVNode;
  //为空节点创建 VNode
  target._e = createEmptyVNode;
  target._u = resolveScopedSlots;
  target._g = bindObjectListeners;
  target._d = bindDynamicKeys;
  target._p = prependModifier;
}
