/**
 * 解析模板生成抽象语法树 AST
 * @param {*} template
 */
export default function parse(template) {
  // 栈结构，存放所有未配对的开始标签
  const stack = [];
  let root = null;
  // 保存剩余的未解析的html
  let html = template;
  while (html.trim()) {
    // 过滤注释标签，开始位置是一个注释标签则截取忽略掉
    if (html.indexOf("<!--") === 0) {
      html = html.slice(html.indexOf("-->") + 3);
    }
    // 匹配开始标签
    const startIndex = html.indexOf("<");
    if (startIndex === 0) {
      if (html.indexOf("</") === 0) {
        // 说明时结束闭合标签
        parseEnd();
      } else {
        // 处理开始标签
        parseStartTag();
      }
    } else if (startIndex > 0) {
      // 说明当前位置到开始标签之间有一段文本内容，在 html 中找到下一个标签的开始位置
      const nextStartIndex = html.indexOf("<");
      // 如果栈为空，说明这段文本不属于任何一个元素，直接丢掉，不做处理（比如空字符串）
      if (stack.length) {
        // 走这里说明栈不为空，则处理这段文本，并将其放到栈顶元素的肚子里
        processChars(html.slice(0, nextStartIndex));
      }
      html = html.slice(nextStartIndex);
    } else {
      // 说明没有匹配到开始标签，整个 html 就是一段文本
    }
  }
  return root;

  /**
   * 解析开始标签
   * 例如: <div id="app" class='className'>...</div>
   */
  function parseStartTag() {
    // 找到开始标签的结束位置 >
    const end = html.indexOf(">");
    // 解析开始标签里的内容 <内容>，标签名 + 属性，比如：div id="app" class='className'
    const content = html.slice(1, end);
    // 截断 html，将上面解析的内容从 html 字符串中删除
    html = html.slice(end + 1);
    // 找到第一个空格位置，用于拆标签名和属性
    const firstSpaceIdx = content.indexOf(" ");
    let tagName = "";
    let attrsStr = "";
    if (firstSpaceIdx === -1) {
      // 没有空格，说明只有标签名，没有属性 tagName = content
      tagName = content;
      attrsStr = "";
    } else {
      // content 剩下的内容就是属性，比如 id="app" class='className'
      tagName = content.slice(0, firstSpaceIdx);
      attrsStr = content.slice(firstSpaceIdx + 1);
    }

    // 得到属性数组，[id="app",xx=xx]
    const attrs = attrsStr ? attrsStr.split(" ") : [];
    // 进一步解析属性数组，得到一个 Map 对象
    const attrMap = parseAttrs(attrs);
    // 生成 AST 对象
    const elementAst = generateAST(tagName, attrMap);
    // 如果根节点不存在，则说明当前节点为整个模板的第一个节点
    if (!root) {
      root = elementAst;
    }

    // 将 ast 对象 push 到栈中，当遇到结束标签的时候就将栈顶的 ast 对象 pop出来，他们俩是一对
    stack.push(elementAst);

    // 自闭合标签，则直接调用 end 方法，进入闭合标签的处理截断，就不入栈了
    if (isUnaryTag(tagName)) {
      processElement();
    }
  }

  /**
   * 处理结束标签
   */
  function parseEnd() {
    // 将结束标签截掉
    html = html.slice(html.indexOf(">") + 1);
    // 处理栈顶元素
    processElement();
  }

  /**
   * 解析属性数组，得到一个属性和值组成的 Map 对象
   * {
   *  id:app,
   *  class:'normalclass',
   *  xx:xx
   * }
   * @param {*} attrs [id="app",xx=xx]
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
   * @param {*} tagName
   * @param {*} attrMap
   */
  function generateAST(tagName, attrMap) {
    return {
      type: 1,
      tag: tagName,
      rawAttr: attrMap,
      children: [],
    };
  }

  /**
   * 处理文本
   * @param {*} text
   */
  function processChars(text) {
    // 去除空字符串或者换行符的情况
    if (!text.trim()) {
      return;
    }
    // 构造文本节点的 AST 对象
    const textAst = {
      type: 3,
      text,
    };

    if (text.match(/{{(.*)}}/)) {
      // 说明是表达式
      textAst.expression = RegExp.$1.trim();
    }
    // 将 ast 放到栈顶元素的`children`中
    stack[stack.length - 1].children.push(textAst);
  }

  /**
   * 处理元素的闭合标签时会调用该方法
   * 进一步处理元素上的各个属性，将处理结果放到 attr 属性上
   */
  function processElement() {
    // 弹出栈顶元素，进一步处理该元素
    const curEle = stack.pop();
    const stackLen = stack.length;
    // 进一步处理 AST 对象中的 rawAttr 对象
    const { tag, rawAttr } = curEle;
    // 将处理结果放到 attr 对象上，并删除掉 rawAttr 对象中相应的属性
    curEle.attr = {};

    const propertyArr = Object.keys(rawAttr);
    if (propertyArr.includes("v-model")) {
      // 处理 v-model 指令
      processVModel(curEle);
    } else if (propertyArr.find((item) => item.match(/^v-bind:(.*)/))) {
      // 处理 v-bind 指令，比如 <span v-bind:test="xx" />
      processVBind(curEle, RegExp.$1, rawAttr[`v-bind:${RegExp.$1}`]);
    } else if (propertyArr.find((item) => item.match(/^v-on:(.*)/))) {
      // 处理 v-on 指令 比如 <button v-on:click="add"> add </button>
      processVOn(curEle, RegExp.$1, rawAttr[`v-on:${RegExp.$1}`]);
    }

    // 处理插槽内容
    processSlotContent(curEle);

    // 节点处理完成后让其和父节点产生关系
    if (stackLen) {
      stack[stackLen - 1].children.push(curEle);
      curEle.parent = stack[stackLen - 1];

      if (curEle.slotName) {
        const { parent, slotName, scopeSlot, children } = curEle;
        // 这里关于 children 的操作，只是单纯为了避开 JSON.stringify 的循环引用问题
        // 因为生成渲染函数时需要对 attr 执行 JSON.stringify 方法
        const slotInfo = {
          slotName,
          scopeSlot,
          children: children.map((item) => {
            delete item.parent;
            return item;
          }),
        };
        if (parent.rawAttr.scopedSlots) {
          parent.rawAttr.scopedSlots[curEle.slotName] = slotInfo;
        } else {
          parent.rawAttr.scopedSlots = { [curEle.slotName]: slotInfo };
        }
      }
    }
  }
}

/**
 * 处理 v-model 指令，将处理结果直接放到 curEle 对象身上
 * @param {*} curEle
 */
function processVModel(curEle) {
  const { tag, rawAttr, attr } = curEle;
  const { type, "v-model": vModelVal } = rawAttr;

  if (tag === "input") {
    if (/text/.test(type)) {
      // <input type="text" v-model="inputVal" />
      attr.vModel = { tag, type: "text", value: vModelVal };
    } else if (/checkbox/.test(type)) {
      // <input type="checkbox" v-model="isChecked" />
      attr.vModel = { tag, type: "checkbox", value: vModelVal };
    }
  } else if (tag === "textarea") {
    // <textarea v-model="test" />
    attr.vModel = { tag, value: vModelVal };
  } else if (tag === "select") {
    // <select v-model="selectedValue">...</select>
    attr.vModel = { tag, value: vModelVal };
  }
}

/**
 * 处理 v-bind 指令
 * @param {*} curEle 当前正在处理的 AST 对象
 * @param {*} bindKey v-bind:key 中的 key
 * @param {*} bindVal v-bind:key = val 中的 val
 */
function processVBind(curEle, bindKey, bindVal) {
  curEle.attr.vBind = { [bindKey]: bindVal };
}

/**
 * 处理 v-on 指令
 * @param {*} curEle 当前被处理的 AST 对象
 * @param {*} vOnKey v-on:key 中的 key
 * @param {*} vOnVal v-on:key="val" 中的 val
 */
function processVOn(curEle, vOnKey, vOnVal) {
  curEle.attr.vOn = { [vOnKey]: vOnVal };
}

/**
 * 是否为自闭合标签，内置一些自闭合标签，为了处理简单
 */
export function isUnaryTag(tagName) {
  const unaryTag = ["input"];
  return unaryTag.includes(tagName);
}

/**
 * 处理插槽
 * <scope-slot>
 *   <template v-slot:default="scopeSlot">
 *     <div>{{ scopeSlot }}</div>
 *   </template>
 * </scope-slot>
 * @param { AST } el 节点的 AST 对象
 */
function processSlotContent(el) {
  // 注意，具有 v-slot:xx 属性的 template 只能是组件的根元素，这里不做判断
  if (el.tag === "template") {
    // 获取插槽信息
    // 属性 map 对象
    const attrMap = el.rawAttr;
    // 遍历属性 map 对象，找出其中的 v-slot 指令信息
    for (let key in attrMap) {
      if (key.match(/v-slot:(.*)/)) {
        // 说明 template 标签上 v-slot 指令
        // 获取指令后的插槽名称和值，比如: v-slot:default=xx
        // default
        const slotName = (el.slotName = RegExp.$1);
        // xx
        el.scopeSlot = attrMap[`v-slot:${slotName}`];
        // 直接 return，因为该标签上只可能有一个 v-slot 指令
        return;
      }
    }
  }
}
