/* @flow */

import { makeMap, isBuiltInTag, cached, no } from "shared/util";

let isStaticKey;
let isPlatformReservedTag;

const genStaticKeysCached = cached(genStaticKeys);

/**
 * Goal of the optimizer: walk the generated template AST tree
 * and detect sub-trees that are purely static, i.e. parts of
 * the DOM that never needs to change.
 *
 * Once we detect these sub-trees, we can:
 *
 * 1. Hoist them into constants, so that we no longer need to
 *    create fresh nodes for them on each re-render;
 * 2. Completely skip them in the patching process.
 */

/**
 * 优化：
 * 1.将它们提升为常量，这样我们就不再需要在每次重新渲染时为它们创建新的节点
 * 2.在 patch 过程中可以完全跳过它们
 *
 * 主要做了：遍历AST,标记每个节点是静态节点还是动态节点，然后标记静态根节点
 *          这样在后续更新过程中就不需要再关注这些节点
 */
export function optimize(root: ?ASTElement, options: CompilerOptions) {
  if (!root) return;
  isStaticKey = genStaticKeysCached(options.staticKeys || "");
  // 平台保留标签
  isPlatformReservedTag = options.isReservedTag || no;
  // first pass: mark all non-static nodes.
  // 遍历所有节点，给每个节点设置 static 属性，标识其是否为静态节点
  markStatic(root);
  // second pass: mark static roots.
  // 进一步标记静态根节点，一个节点要想成为静态根节点，需要具体以下条件：
  // 1.> 节点本身是静态节点，而且有子节点，并且子节点不只是一个文本节点，则标记为静态根节点
  // 2.> 静态根节点不能只有静态文本的子节点，因为这样收益太低，这种情况下始终更新它就好了
  markStaticRoots(root, false);
}

function genStaticKeys(keys: string): Function {
  return makeMap(
    "type,tag,attrsList,attrsMap,plain,parent,children,attrs,start,end,rawAttrsMap" +
      (keys ? "," + keys : "")
  );
}

/**
 * 在所有节点上设置 static 属性，用来标识是否是静态节点
 * 注意：如果子节点为动态节点，则父节点也会被认为是动态节点
 */
function markStatic(node: ASTNode) {
  // 通过 node.static 来标识节点是否为静态节点
  node.static = isStatic(node);
  if (node.type === 1) {
    // do not make component slot content static. this avoids
    // 1. components not able to mutate slot nodes
    // 2. static slot content fails for hot-reloading
    /**
     * 不要将组件的插槽内容设置为静态节点，这样可以避免:
     * 1. 组件不能改变插槽节点
     * 2. 静态插槽内容在热重载时失败
     */
    if (
      !isPlatformReservedTag(node.tag) &&
      node.tag !== "slot" &&
      node.attrsMap["inline-template"] == null
    ) {
      // 递归终止条件，如果节点不是平台保留标签 && 也不是 slot 标签 && 也不是内联模板，则直接结束
      return;
    }
    // 遍历子节点，递归调用 markStatic 来标记这些子节点的 static 属性。
    for (let i = 0, l = node.children.length; i < l; i++) {
      const child = node.children[i];
      markStatic(child);
      // 如果子节点是非静态节点，则将父节点更新为非静态节点
      if (!child.static) {
        node.static = false;
      }
    }
    // 如果节点存在 v-if, v-else-if, v-else 这些指令，则依次标记 block 中节点的static
    if (node.ifConditions) {
      for (let i = 1, l = node.ifConditions.length; i < l; i++) {
        const block = node.ifConditions[i].block;
        markStatic(block);
        if (!block.static) {
          node.static = false;
        }
      }
    }
  }
}

/**
 * 进一步标记静态根节点，一个节点要想成为静态根节点，需要具体以下条件：
 * 1. 节点本身是静态节点，而且有子节点，并且子节点不只是一个文本节点，则标记为静态根节点
 * 2. 静态根节点不能只有静态文本的子节点，因为这样收益太低，这种情况下始终更新它就好了
 * @param {*} node  当前节点
 * @param {*} isInFor 当前节点是否被包裹在 v-for 指令所在的节点内
 * @returns
 */
function markStaticRoots(node: ASTNode, isInFor: boolean) {
  if (node.type === 1) {
    if (node.static || node.once) {
      // 节点是静态的 或者 节点上有 v-once 指令，标记 node.staticInFor = trur or false
      node.staticInFor = isInFor;
    }
    // For a node to qualify as a static root, it should have children that
    // are not just static text. Otherwise the cost of hoisting out will
    // outweigh the benefits and it's better off to just always render it fresh.
    /**
     * 一个节点要想成为一个静态根节点，它的子节点应该不仅仅是静态文本。否则成本会超过收益
     * 最好仅仅总是刷新它。
     */
    if (
      node.static &&
      node.children.length &&
      !(node.children.length === 1 && node.children[0].type === 3)
    ) {
      // 节点本身是静态节点，而且有子节点，并且节点不只是一个文本节点，则标记为静态根节点
      node.staticRoot = true;
      // 注意：如果当前节点已经被标记为静态根节点，则将不会再处理子节点
      return;
    } else {
      node.staticRoot = false;
    }

    // 当节点不是静态根节点的时候，递归遍历其子节点，标记静态根
    if (node.children) {
      for (let i = 0, l = node.children.length; i < l; i++) {
        markStaticRoots(node.children[i], isInFor || !!node.for);
      }
    }
    // 如果节点存在 v-if, v-else-if, v-else 指令，则为 block 节点标记静态根
    if (node.ifConditions) {
      for (let i = 1, l = node.ifConditions.length; i < l; i++) {
        markStaticRoots(node.ifConditions[i].block, isInFor);
      }
    }
  }
}

/**
 * 判断节点是否为静态节点：
 * 1.通过自定义的 node.type 来判断。2：表达式 => 动态，3：文本 => 静态纯文本
 * 2.如果节点上有 v-pre 指令，那么可以直接判断它是一个静态节点
 * 3.如果没有 v-pre 执行，那么它必须满足以下条件才会被认为时一个静态节点：
 *   ① 不能使用动态绑定语法，也就是说标签上不能有 v-on, @ , : 开头的属性
 *   ② 不能使用 v-if, v-for, 或者 v-else 指令
 *   ③ 不能是内置标签，也就是说标签名不能是 slot 或者 component
 *   ④ 不能是组件，即标签名必须是平台保留标签，例如 <div></div>是平台保留标签，而<list></list> 不是保留标签
 *   ⑤ 当前节点的父节点不能是带 v-for 指令的 template 标签
 *   ⑥ 节点中不存在动态节点才会有的属性
 * @param {*} node
 * @returns
 */
function isStatic(node: ASTNode): boolean {
  if (node.type === 2) {
    // expression 表达式，比如：{{message}}
    return false;
  }
  if (node.type === 3) {
    // text 文本节点
    return true;
  }
  return !!(
    node.pre ||
    (!node.hasBindings && // no dynamic bindings
      !node.if &&
      !node.for && // not v-if or v-for or v-else
      !isBuiltInTag(node.tag) && // not a built-in //不是内置标签
      isPlatformReservedTag(node.tag) && // not a component
      !isDirectChildOfTemplateFor(node) &&
      Object.keys(node).every(isStaticKey))
  );
}

function isDirectChildOfTemplateFor(node: ASTElement): boolean {
  while (node.parent) {
    node = node.parent;
    if (node.tag !== "template") {
      return false;
    }
    if (node.for) {
      return true;
    }
  }
  return false;
}
