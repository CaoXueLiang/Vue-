function nestTokens(tokens) {
  let nestedTokens = []; //结果数组
  let section = []; //栈数组，用于记录#数组
  let collector = nestedTokens; //collector收集器，天生指向`nestedTokens`,当遇到`#`时指向["#","students"]的第二项
  for (let index = 0; index < tokens.length; index++) {
    const element = tokens[index];
    if (element[0] == "#") {
      //收集器放入这个token
      collector.push(element);
      section.push(element);
      collector = element[2] = [];
    } else if (element[0] == "/") {
      section.pop();
      collector =
        section.length > 0 ? section[section.length - 1][2] : nestedTokens;
    } else {
      collector.push(element);
    }
  }
  return nestedTokens;
}

export default nestTokens;
