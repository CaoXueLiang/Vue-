import { isUnaryTag } from "../utils/index.js";

/**
 * 解析模板字符串，生成 ast 对象
 * @param {*} template
 */
export default function parse(template) {
  // 存放所有的未配对的开始标签的AST对象
  const stack = [];
  // 最终的 ast对象
  let root = null;

  let html = template;
  while (html.trim()) {
    // 过滤注释标签
    if (html.indexOf("<!--") === 0) {
      html = html.slice(html.indexOf("-->") + 3);
      continue;
    }
    // 匹配开始标签
    const startIdx = html.indexOf("<");
    if (startIdx === 0) {
      if (html.indexOf("</") === 0) {
        // 说明是闭合标签
        parseEnd();
      } else {
        // 说明是开始标签
        parseStartTag();
      }
    } else if (startIdx > 0) {
      // 说明在开始标签之前有一段文本内容，在 html 中找到下一个标签的开始位置
      const nextStartIdx = html.indexOf("<");
      if (stack.length) {
        // 走到这里说明栈不为空，则处理这段文本，并将其放到栈顶元素的肚子里
        processChars(html.slice(0, nextStartIdx));
      }
      html = html.slice(nextStartIdx);
    } else {
      // 没有匹配到开始标签，整个 html 就是一段文本
    }
  }

  return root;

  /**
   * 解析开始标签
   * 比如：<div id="app">...</div>
   */
  function parseStartTag() {
    // 先找到开始标签的结束位置
    const end = html.indexOf(">");
    // 解析开始标签里的内容 <内容>， 标签名 + 属性名。比如：div id="app"
    const content = html.slice(1, end);
    // 截断 html,将上面解析的内容从html字符串中删除
    html = html.slice(end + 1);
    // 找到第一个空格位置
    const firstSpaceIdx = content.indexOf(" ");
    // 获取标签名和属性字符串
    let tagName = "";
    let attrsStr = "";
    if (firstSpaceIdx === -1) {
      // 没有空格说明，没有属性, content 就是标签名。比如：<h3></h3>
      tagName = content;
      attrsStr = "";
    } else {
      tagName = content.slice(0, firstSpaceIdx);
      attrsStr = content.slice(firstSpaceIdx + 1);
    }

    // 得到属性数组，[id="app", xx=xx]
    const attrs = attrsStr ? attrsStr.split(" ") : [];
    // 进一步解析属性数组，得到一个map对象
    const attrMap = parseAttrs(attrs);
    // 生成 AST 对象
    const elementAst = generateAST(tagName, attrMap);
    // 如果根节点不存在，说明当前节点为整个模板的第一个节点
    if (!root) {
      root = elementAst;
    }
    // 将 ast 对象 push 到栈中，当遇到结束标签的时候就将栈顶的 ast对象pop出来，它俩是一对
    stack.push(elementAst);

    // 自闭合标签，则直接调用 end 方法，进入闭合标签的处理截断，就不入栈了
    if (isUnaryTag(tagName)) {
      processElement();
    }
  }

  /**
   * 处理结束标签
   * 比如：<div id="app"></div>
   */
  function parseEnd() {
    // 将结束标签从 html 字符串中截掉
    html = html.slice(html.indexOf(">") + 1);
    // 处理栈顶元素
    processElement();
  }

  /**
   * 处理文本
   * @param {String} text
   */
  function processChars(text) {
    // 去除空格或者换行符的情况
    if (!text.trim()) {
      return;
    }
    // 构造文本节点的 AST 对象
    const textAst = {
      type: 3,
      text,
    };
    // 正则匹配, 比如：'xiaoming{{age}}岁'.match(/{{(.*)}}/) => ['{{age}}', 'age', index: 8, input: 'xiaoming{{age}}岁', groups: undefined]
    const regResult = text.match(/{{(.*)}}/);
    if (regResult) {
      // 说明是表达式
      textAst.expression = regResult[1].trim();
    }
    // 将 ast 放到栈顶元素的children中
    stack[stack.length - 1].children.push(textAst);
  }

  /**
   * 处理元素的闭合标签时会调用该方法
   * 进一步处理元素上的各个属性，将处理结果放到 attr 属性上
   *
   */
  function processElement() {
    // 弹出栈顶元素，进一步处理该元素
    const curEle = stack.pop();
    const stackLength = stack.length;
    // 进一步处理 AST 对象中的 rawAttr 对象 {attrName: attrValue, ...}
    const { tag, rawAttr } = curEle;
    // 将处理结果都放到 attr对象上，并删除 rawAttr 对象中对应的属性
    curEle.attr = {};
    const propertyArr = Object.keys(rawAttr);
    // 返回值为：'v-bind:xxx'
    const vBindValue = propertyArr.find((item) => item.match(/^v-bind:(.*)/));
    // 返回值为：'v-on:xxx'
    const vOnValue = propertyArr.find((item) => item.match(/^v-on:(.*)/));
    if (propertyArr.includes("v-model")) {
      // 处理 v-model 指令
      processVModel(curEle);
    } else if (vBindValue) {
      // 处理 v-bind 指令
      const bindvalue = vBindValue.match(/v-bind:(.*)/)[1];
      processVBind(curEle, bindvalue, rawAttr[vBindValue]);
    } else if (vOnValue) {
      // 处理 v-on 指令
      const onvalue = vOnValue.match(/v-on:(.*)/)[1];
      processVOn(curEle, onvalue, rawAttr[vOnValue]);
    }

    // 节点处理完以后让其和父节点产生关系
    if (stackLength) {
      stack[stackLength - 1].children.push(curEle);
      curEle.parent = stack[stackLength - 1];
    }
  }
}

/**
 * 解析属性数组，得到属性和值组成的`map`对象
 * @param {*} attrs 属性数组，[id="app", xx=xx]
 */
function parseAttrs(attrs) {
  const attrMap = {};
  for (let index = 0; index < attrs.length; index++) {
    const attr = attrs[index];
    const [attrName, attrValue] = attr.split("=");
    attrMap[attrName] = attrValue.replace(/"/g, "");
  }
  return attrMap;
}

/**
 * 生成 AST 对象
 * @param {*} tagName 标签名
 * @param {*} attrMap 标签组成的属性 map 对象
 */
function generateAST(tagName, attrMap) {
  return {
    type: 1, //元素节点
    tag: tagName, //标签
    rawAttr: attrMap, // 原始属性 map 对象，后续还需进一步处理
    children: [], // 子节点
  };
}

/**
 * 处理 v-model 指令，将处理结果直接放到 curEle 对象上
 * @param {*} curEle
 */
function processVModel(curEle) {
  const { tag, rawAttr, attr } = curEle;
  const { type, "v-model": vModelValue } = rawAttr;
  if (tag === "input") {
    if (/text/.test(type)) {
      // <input type="text" v-model="inputVal" />
      attr.vModel = { tag, type: "text", value: vModelValue };
    } else if (/checkbox/.test(type)) {
      // <input type="checkbox" v-model="isChecked" />
      attr.vModel = { tag, type: "checkbox", value: vModelValue };
    }
  } else if (tag === "textarea") {
    // <textarea v-model="test" />
    attr.vModel = { tag, value: vModelValue };
  } else if (tag === "select") {
    // <select v-model="selectedValue">...</select>
    attr.vModel = { tag, value: vModelValue };
  }
}

/**
 * 处理 v-bind 指令
 * @param {*} curEle 当前被处理的AST对象
 * @param {*} bindKey v-bind:key中的key
 * @param {*} bindValue v-bind:key = val中的val
 */
function processVBind(curEle, bindKey, bindValue) {
  curEle.attr.vBind = { [bindKey]: bindValue };
}

/**
 * 处理 v-on 指令
 * @param {*} curEle 当前被处理的AST对象
 * @param {*} vOnKey v-on:key中的key
 * @param {*} vOnValue v-on:key = val中的val
 */
function processVOn(curEle, vOnKey, vOnValue) {
  curEle.attr.vOn = { [vOnKey]: vOnValue };
}
