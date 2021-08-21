let anotherArray = [
  { name: "小明", age: 12, sex: "男" },
  { name: "小红", age: 11, sex: "女" },
  { name: "小强", age: 13, sex: "男" },
];

function createDomWithJoin() {
  let domHtmlStr = "";
  for (let index = 0; index < anotherArray.length; index++) {
    const element = anotherArray[index];
    let domArray = [
      "<li>",
      '<div class="hd">' + element.name + "的基本信息</div>",
      '<div class="bd">',
      "<p>姓名：" + element.name + "</p>",
      "<p>年龄：" + element.age + "</p>",
      "<p>性别：" + element.sex + "</p>",
      "</div>",
      "</li>",
    ];
    domHtmlStr += domArray.join("");
  }
  console.log(domHtmlStr);
  let ulElement = document.getElementById("elementId1");
  ulElement.innerHTML = domHtmlStr;
}

createDomWithJoin();
