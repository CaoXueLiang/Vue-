import parseAttributes from "./parseAttributes";

const startRegexp = /^\<([a-z]+[1-6]?)(\s[^\<]+)?\>/;

const endRegexp = /^\<\/([a-z]+[1-6]?)\>/;
const isContent = /^([^\<]+)\<\/([a-z]+[1-6]?)\>/;

export default function parse(template) {
  let index = 0;
  let stack1 = []; //存放标签数组
  let stack2 = []; // 存放数据数组
  let restStr = template;
  while (index < template.length - 1) {
    if (startRegexp.test(restStr)) {
      //匹配开始位置
      const tag = restStr.match(startRegexp)[1];
      const attributes = restStr.match(startRegexp)[2];
      stack1.push({
        name: tag,
        attributes: attributes ? parseAttributes(attributes) : [],
        children: [],
        type: "Element",
      });
      stack2.push([]);
      index += tag.length + 2;
    } else if (isContent.test(restStr)) {
      //匹配内容
      const content = restStr.match(isContent)[1];
      if (content.length > 0 && !/\s+/.test(content)) {
        stack2[stack2.length - 1].push({ value: content, type: "Text" });
      }
      index += content.length;
    } else if (endRegexp.test(restStr)) {
      //匹配结束位置
      const tag = restStr.match(endRegexp)[1];
      if (stack1.length > 1 && stack2.length > 1) {
        const pop_tag = stack1.pop();
        const pop_content = stack2.pop();
        pop_tag.children.push(pop_content);
        stack2[stack2.length - 1].push(pop_tag);
      }
      index += tag.length + 3;
    } else {
      index++;
    }
    restStr = template.substring(index);
  }

  stack1[0].children.push(stack2[0]);
  return stack1[0];
}
