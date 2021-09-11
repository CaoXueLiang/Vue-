/**
  形式转换：试将高维数组[1,2,[3,[4,5],6],7,[8],9]变为图中所示的对象? 

  {
      children:[
          {value:1},
          {value:2},
          {children:[{value:3},
                  {children:[{value:4},{vlaue:5},]},
                  {value:6}
              ]
          },
        {value:7},
        {chidren:[{value:8}]},
        {value:9}
      ]
  }
 */

const normalArray = [1, 2, [3, [4, 5], 6], 7, [8], 9];

function convert(arr) {
  let tmpArr = [];
  for (let index = 0; index < arr.length; index++) {
    const element = arr[index];
    if (typeof element === "number") {
      tmpArr.push({ value: element });
    } else if (Array.isArray(element)) {
      tmpArr.push(convert(element));
    }
  }
  return { children: tmpArr };
}

console.log(convert(normalArray));
