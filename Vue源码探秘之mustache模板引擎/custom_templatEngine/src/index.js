import parseTemplateToTokens from "./parseTemplateToTokens";

window.Custom_TemplateEngine = {
  render(template, data) {
    let tokes = parseTemplateToTokens(template);
    console.log(tokes);
  },
};

let tmpTemplate = `我买了一个{{thing}}，好{{mood}}啊`;
let tmpData = {
  thing: "华为手机",
  mood: "开心",
};

// 模板字符串
var templateStr = `
    <div>
        <ul>
            {{#students}}
            <li class="myli">
                学生{{item.name}}的爱好是
                <ol>
                    {{#item.hobbies}}
                    <li>{{.}}</li>
                    {{/item.hobbies}}
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

Custom_TemplateEngine.render(templateStr, data);
