import parseTemplateToTokens from "./parseTemplateToTokens";
import renderTemplate from "./renderTemplate";

window.Custom_TemplateEngine = {
  render(template, data) {
    //将模板字符串，转化为tokens
    let tokes = parseTemplateToTokens(template);
    console.log("tokes", tokes);
    //将tokens和data转化为dom字符串
    let domStr = renderTemplate(tokes, data);
    console.log("domstr", domStr);
    return domStr;
  },
};

// let tmpTemplate = `<div>我买了一个{{thing}}，好{{a.b.c}}啊</div>`;
// let tmpData = {
//   thing: "华为手机",
//   a: {
//     b: {
//       c: "伤心",
//     },
//   },
// };

// 模板字符串
var templateStr = `
    <div>
        <ul>
            {{#students}}
            <li class="myli">
                学生{{name}}的爱好是
                <ol>
                    {{#hobbies}}
                    <li>{{.}}</li>
                    {{/hobbies}}
                </ol>
            </li>
            {{/students}}
        </ul>
    </div>
`;

// 数据
var data = {
  students: [
    { name: "小明", hobbies: ["编程", "游泳"] },
    { name: "小红", hobbies: ["看书", "弹琴", "画画"] },
    { name: "小强", hobbies: ["锻炼"] },
  ],
};

let domstr = Custom_TemplateEngine.render(templateStr, data);
document.body.innerHTML = domstr;
