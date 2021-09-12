import parse from "./parse";

const templateStr = `
<div class = "box middle" id = "boxId">
    <h3>你好</h3>
    <ul class = "ulClass">
        <li>A</li>
        <li>B</li>
        <li>C</li>
    </ul>
    <div>
     <span>哈哈哈</span>
     <span>嘿嘿嘿嘿嘿</span>
    </div>
</div>`;

console.log("result", parse(templateStr));
