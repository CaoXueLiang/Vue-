/** 非常笨拙，具备实战价值 */

let dataArray = [
  { name: "小明", age: 12, sex: "男" },
  { name: "小红", age: 11, sex: "女" },
  { name: "小强", age: 13, sex: "男" },
];

function createDomMethod() {
  let ul = document.createElement("ul");
  for (let index = 0; index < dataArray.length; index++) {
    const element = dataArray[index];
    let li = document.createElement("li");
    ul.appendChild(li);
    let div1 = document.createElement("div");
    div1.className = "hd";
    let div2 = document.createElement("div");
    div2.className = "bd";
    li.appendChild(div1);
    li.appendChild(div2);
    let p1 = document.createElement("p");
    let p2 = document.createElement("p");
    let p3 = document.createElement("p");
    div2.appendChild(p1);
    div2.appendChild(p2);
    div2.appendChild(p3);

    div1.innerText = `${element.name}的基本信息`;
    p1.innerText = `姓名：${element.name}`;
    p2.innerText = `年龄：${element.age}`;
    p3.innerText = `性别：${element.sex}`;
  }
  document.body.appendChild(ul);
}

createDomMethod();
