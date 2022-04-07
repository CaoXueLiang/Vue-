/* @flow */

/**
 * Runtime helper for rendering static trees.
 * 运行时负责生成静态树的VNode
 * 完成了两件事：
 * 1. 执行 staticRenderFns 数组中指定下标的渲染函数，生成静态树的 VNode 并缓存，下次在渲染时从缓存中直接读取（isInFor 必须为 true）
 * 2. 为静态树的 VNode 打静态标记
 * @param {*} index index 表示当前静态节点的渲染函数在 staticRenderFns 数组中的下标索引
 * @param {*} isInFor isInFor 表示当前静态节点是否被包裹在含有 v-for 指令的节点内部
 * @returns
 */
export function renderStatic(
  index: number,
  isInFor: boolean
): VNode | Array<VNode> {
  const cached = this._staticTrees || (this._staticTrees = []);
  let tree = cached[index];
  // if has already-rendered static tree and not inside v-for,
  // we can reuse the same tree.
  if (tree && !isInFor) {
    return tree;
  }
  // otherwise, render a fresh tree.
  //1.执行 staticRenderFns 数组中指定下标的渲染函数，生成静态树的VNode,并缓存
  tree = cached[index] = this.$options.staticRenderFns[index].call(
    this._renderProxy,
    null,
    this // for render fns generated for functional component templates
  );
  //2.静态标记，为静态树的 VNode 打标记
  markStatic(tree, `__static__${index}`, false);
  return tree;
}

/**
 * Runtime helper for v-once.
 * Effectively it means marking the node as static with a unique key.
 * v-once 执行的运行时帮助程序，为 VNode 加上静态标记
 * 含有 v-once 指令的节点都会被当作静态节点处理了
 */
export function markOnce(
  tree: VNode | Array<VNode>,
  index: number,
  key: string
) {
  markStatic(tree, `__once__${index}${key ? `_${key}` : ``}`, true);
  return tree;
}

/**
 * 为 VNode 打静态标记，在VNode上添加三个属性
 * {
 *   isStatic:xx,
 *   key:xx,
 *   isOnce:true or false
 * }
 */
function markStatic(tree: VNode | Array<VNode>, key: string, isOnce: boolean) {
  if (Array.isArray(tree)) {
    //遍历每个节点，为每个VNode做静态标记
    for (let i = 0; i < tree.length; i++) {
      if (tree[i] && typeof tree[i] !== "string") {
        markStaticNode(tree[i], `${key}_${i}`, isOnce);
      }
    }
  } else {
    markStaticNode(tree, key, isOnce);
  }
}

function markStaticNode(node, key, isOnce) {
  node.isStatic = true;
  node.key = key;
  node.isOnce = isOnce;
}
