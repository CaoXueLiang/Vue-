/**
 * 寻找连续点号的元素
 * @param {*} data 数据
 * @param {*} name a.b.c
 */
function lookUp(data, name) {
  if (name.includes(".") && name !== ".") {
    let tmpArray = name.split(".");
    let result = tmpArray.reduce((pre, current) => {
      return pre[current];
    }, data);
    return result;
  } else {
    return data[name];
  }
}

export default lookUp;
