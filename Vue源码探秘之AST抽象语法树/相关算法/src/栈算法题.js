/**
 试编写“智能重复”smartRepeat函数，实现：
 • 将3[abc]变为abcabcabc
 • 将3[2[a]2[b]]变为aabbaabbaabb
 • 将2[1[a]3[b]2[3[c]4[d]]]变为abbbcccddddcccddddabbbcccddddcccdddd
 */

/**
  规则：准备两个栈，栈1和栈2. 栈1用来存储数字重复次数，栈2用来存储中括号里面的字母
  ① 遇到数字，将数字添加到栈1
  ② 遇到`[`字符将空字符串，添加到栈2
  ③ 遇到`[]`之间的字符时，将栈2的栈顶字符替换为该字符
  ④ 遇到`]`将栈1的栈顶弹栈 -> m，同时将栈2的栈顶弹栈 ->n ,最后将栈2弹栈的字符n重复m次拼接到栈2栈顶字符的后面
  */

const normalStr = "2[1[a]3[b]2[3[c]4[d]]]";

function smartRepeat(str) {
  let index = 0;
  let stack1 = [];
  let stack2 = [];
  let restStr = str;
  while (index < str.length - 1) {
    if (/^\d+\[/.test(restStr)) {
      //匹配`[`开头
      const times = restStr.match(/^(\d+)\[/)[1];
      stack1.push(Number(times));
      stack2.push("");
      index += times.length + 1;
    } else if (/^\w+\]/.test(restStr)) {
      //匹配`[]`里面的单词
      const currentStr = restStr.match(/^(\w+)\]/)[1];
      stack2[stack2.length - 1] = currentStr;
      index += currentStr.length;
    } else if (restStr[0] === "]") {
      //匹配`]`单词
      const times = stack1.pop();
      const catchStr = stack2.pop();
      stack2[stack2.length - 1] =
        stack2[stack2.length - 1] + catchStr.repeat(times);
      index++;
    } else {
      index++;
    }
    restStr = str.substring(index);

    console.log(stack1, stack2);
  }
  return stack2[0].repeat(stack1[0]);
}

console.log(smartRepeat(normalStr));
