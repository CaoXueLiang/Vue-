/**
试寻找字符串中，连续重复次数最多的字符 ?
'aaaabbbbbcccccccccccccdddddd'
  移动规则:
  ① 如果 leftIndex 和 rightIndex 指向的字母相同则 rightIndex后移一位
  ② 如果 leftIndex 和 rightIndex 指向的字母不同，leftIndex移动到 rightIndex的位置，rightIndex后移一位
 */

const normalStr = "aaaabbbbbcccccccccccccdddddd";
function lookforMaxChar(str) {
  let leftIndex = 0;
  let rightIndex = 0;
  let maxChar = "";
  let maxCount = 0;
  while (leftIndex < str.length - 1) {
    if (str[leftIndex] !== str[rightIndex]) {
      let currentStr = str[leftIndex];
      let currentCount = rightIndex - leftIndex;
      console.log(`我是字母${currentStr},我重复了${currentCount}次`);
      if (currentCount > maxCount) {
        maxCount = currentCount;
        maxChar = currentStr;
      }
      leftIndex = rightIndex;
    }
    rightIndex++;
  }
  return {
    maxChar,
    maxCount,
  };
}

console.log(lookforMaxChar(normalStr));
