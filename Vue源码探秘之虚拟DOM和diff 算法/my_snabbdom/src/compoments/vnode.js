/**
 * 将传入的参数转化为对象返回
 * @param {*} sel
 * @param {*} data
 * @param {*} children
 * @param {*} text
 * @param {*} elm
 * @returns
 */
export default function vnode(sel, data, children, text, elm) {
  const key = data.key;
  return {
    sel,
    data,
    children,
    text,
    elm,
    key,
  };
}
