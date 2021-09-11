/**
 试输出斐波那契数列的前10项，即1、1、2、3、5、8、13、21、34、55。
 然后请思考，代码是否有大量重复的计算？应该如何解决重复计算的问题？
 */

var cacheObj = {}; //缓存数组

function fib(n) {
  console.count();
  if (n == 0 || n == 1) {
    return 1;
  } else {
    if (cacheObj.hasOwnProperty(n)) {
      return cacheObj[n];
    } else {
      let result = fib(n - 1) + fib(n - 2);
      cacheObj[n] = result;
      return result;
    }
  }
}

for (let index = 0; index < 10; index++) {
  console.log(fib(index));
}
