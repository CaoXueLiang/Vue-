import createElement from "./createElement";
import patchVnode from "./patchVnode";

function sameNode(oldVnode, newVnode) {
  return oldVnode.sel === newVnode.sel && oldVnode.key === newVnode.key;
}

export default function updateChidren(parentElm, oldChidren, newChidren) {
  //旧前
  let oldStartIdx = 0;
  //新前
  let newStartIdx = 0;
  //旧后
  let oldEndIdx = oldChidren.length - 1;
  //新后
  let newEndIdx = newChidren.length - 1;
  //旧前节点
  let oldStartVnode = oldChidren[0];
  //旧后节点
  let oldEndVnode = oldChidren[oldChidren.length - 1];
  //新前节点
  let newStartVnode = newChidren[0];
  //新后节点
  let newEndVnode = newChidren[newChidren.length - 1];

  //while循环
  while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
    // 首先不是判断①②③④命中，而是要略过已经加undefined标记的东西
    if (oldStartVnode == null || oldChidren[oldStartIdx] == undefined) {
      oldStartVnode = oldChidren[++oldStartIdx];
    } else if (oldEndVnode == null || oldChidren[oldEndIdx] == undefined) {
      oldEndVnode = oldChidren[--oldEndIdx];
    } else if (newStartVnode == null || newChidren[newStartIdx] == undefined) {
      newStartVnode = newChidren[++newStartIdx];
    } else if (newEndVnode == null || newChidren[newEndIdx] == undefined) {
      newEndVnode = newChidren[--newEndIdx];
    } else if (sameNode(newStartVnode, oldStartVnode)) {
      //①新前与旧前命中
      console.log("①新前与旧前命中");
      patchVnode(oldStartVnode, newStartVnode);
      newStartVnode = newChidren[++newStartIdx];
      oldStartVnode = oldChidren[++oldStartIdx];
    } else if (sameNode(newEndVnode, oldEndVnode)) {
      //②新后与旧后命中
      console.log("②新后与旧后命中");
      patchVnode(oldEndVnode, newEndVnode);
      newEndVnode = newChidren[--newEndIdx];
      oldEndVnode = oldChidren[--oldEndIdx];
    } else if (sameNode(newEndVnode, oldStartVnode)) {
      //③新后与旧前命中
      console.log("③新后与旧前命中");
      patchVnode(oldStartVnode, newEndVnode);
      parentElm.insertBefore(oldStartVnode.elm, oldEndVnode.elm.nextSibling);
      newEndVnode = newChidren[--newEndIdx];
      oldStartVnode = oldChidren[++oldStartIdx];
    } else if (sameNode(newStartVnode, oldEndVnode)) {
      //④新前与旧后命中
      console.log("④新前与旧后命中");
      patchVnode(oldEndVnode, newStartVnode);
      // 如何移动节点？？只要你插入一个已经在DOM树上的节点，它就会被移动
      parentElm.insertBefore(oldEndVnode.elm, oldStartVnode.elm);
      newStartVnode = newChidren[++newStartIdx];
      oldEndVnode = oldChidren[--oldEndIdx];
    } else {
      console.log("四种方案都没有命中");
      //四种方案都没有命中
      //创建一个keyMap映射对象，这样就不用每次都遍历了
      const keyMap = {};
      for (let index = oldStartIdx; index <= oldEndIdx; index++) {
        const key = oldChidren[index].key;
        if (key) {
          keyMap[key] = index;
        }
      }

      console.log(keyMap);
      console.log(newStartIdx);

      //寻找当前这项（newStartIdx）在keyMap中的位置
      const idxInOld = keyMap[newStartVnode.key];
      if (idxInOld === undefined) {
        //表示在keyMap中找不到，是全新的项
        parentElm.insertBefore(createElement(newStartVnode), oldStartVnode.elm);
      } else {
        //如果不是underfined，表示存在，需要移动
        const elmToMove = oldChidren[idxInOld];
        patchVnode(elmToMove, newStartVnode);
        //设置这项为underfined,表示处理完这项了
        oldChidren[idxInOld] = undefined;
        //移动
        parentElm.insertBefore(elmToMove.elm, oldStartVnode.elm);
      }
      // 指针下移，只移动新的头
      newStartVnode = newChidren[++newStartIdx];
    }
  }

  //继续看看有没有剩余的，循环结束了start还是不old小
  if (newStartIdx <= newEndIdx) {
    console.log(
      "new还有剩余节点没有处理，所有剩余的节点，都要插入到oldStartIdx之前"
    );
    for (let index = newStartIdx; index <= newEndIdx; index++) {
      const element = newChidren[index];
      parentElm.insertBefore(
        createElement(element),
        oldChidren[oldStartIdx].elm
      );
    }
  } else if (oldStartIdx <= oldEndIdx) {
    console.log("old还有剩余节点没有处理，要删除项");
    for (let index = oldStartIdx; index < oldEndIdx; index++) {
      const element = oldChidren[index];
      parentElm.removeChild(element.elm);
    }
  }
}
