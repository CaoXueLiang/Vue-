const Mustache = require("mustache");

//----------渲染普通字符串-----------
function singleStrTemplate() {
  let tempalte = `我买了一个{{thing}}，好{{mood}}啊！`;
  let domData = {
    thing: "华为手机",
    mood: "开心",
  };
  let domStr = Mustache.render(tempalte, domData);
  let tmpDiv = document.createElement("div");
  document.body.appendChild(tmpDiv);
  tmpDiv.innerHTML = domStr;
}
singleStrTemplate();

//-----------渲染数组循环字符串----------
function arrayTemplate() {
  let template1 = `
    <ul>
        {{#arr}}
            <li>
                <div class="hd">{{name}}的基本信息</div> 
                <div class="bd"> 
                    <p>姓名：{{name}}</p> 
                    <p>性别：{{sex}}</p> 
                    <p>年龄：{{age}}</p>
                </div>
            </li>
        {{/arr}}
    </ul>
    `;
  let data = {
    arr: [
      { name: "小明", age: 12, sex: "男" },
      { name: "小红", age: 11, sex: "女" },
      { name: "小强", age: 13, sex: "男" },
    ],
  };
  let domStr = Mustache.render(template1, data);
  console.log(domStr);
  let tmpDiv = document.createElement("div");
  document.body.appendChild(tmpDiv);
  tmpDiv.innerHTML = domStr;
}
arrayTemplate();

//----------循环简单数组------------
function simpleArrayTemplate() {
  let template = `
       <ul>
          {{#arr}}
            <li>{{.}}</li>
          {{/arr}}
       </ul>
    `;
  let data = {
    arr: ["香蕉", "苹果", "哈密瓜"],
  };
  let domStr = Mustache.render(template, data);
  console.log(domStr);
  let tmpDiv = document.createElement("div");
  document.body.appendChild(tmpDiv);
  tmpDiv.innerHTML = domStr;
}
simpleArrayTemplate();

//-----------循环嵌套数组------------
function complexArrayTemplate() {
  let template = `
    <ul>
    {{#arr}}
        <li>{{name}}的爱好是:
        <ol>
            {{#hobbies}}
                <li>{{.}}</li>
            {{/hobbies}}
            </ol>
        </li>
    {{/arr}}
  </ul>
    `;
  let data = {
    arr: [
      { name: "小明", age: 12, sex: "男", hobbies: ["唱歌", "跳舞"] },
      { name: "小红", age: 11, sex: "女", hobbies: ["书法", "游泳", "刷剧"] },
      { name: "小强", age: 13, sex: "男", hobbies: ["爬山", "骑行"] },
    ],
  };

  let domStr = Mustache.render(template, data);
  console.log(domStr);
  let tmpDiv = document.createElement("div");
  document.body.appendChild(tmpDiv);
  tmpDiv.innerHTML = domStr;
}
complexArrayTemplate();

//-----------mustache库基本使用 - 布尔值------------
function boolTemplate() {
  let template = `
    <div>
        {{#m}}
            <h1>你好</h1>
        {{/m}}
    </div>
    `;
  let data = {
    m: false,
  };
  let domStr = Mustache.render(template, data);
  console.log(domStr);
  let tmpDiv = document.createElement("div");
  document.body.appendChild(tmpDiv);
  tmpDiv.innerHTML = domStr;
}
boolTemplate();
