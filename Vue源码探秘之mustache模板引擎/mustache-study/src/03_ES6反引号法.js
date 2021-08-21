let tmpArray = [
  { name: "小明", age: 12, sex: "男" },
  { name: "小红", age: 11, sex: "女" },
  { name: "小强", age: 13, sex: "男" },
];

function createDomWithes6() {
  let domHtmlStr = "";
  for (let index = 0; index < tmpArray.length; index++) {
    const element = tmpArray[index];
    domHtmlStr += `
         <li>
             <div class="hd">${element.name}的基本信息</div> 
             <div class="bd"> 
                <p>姓名：${element.name}</p> 
                <p>年龄：${element.age}</p> 
                <p>性别：${element.sex}</p>
             </div>
         </li>`;
  }
  console.log(domHtmlStr);
  let ulElement = document.getElementById("elementId2");
  ulElement.innerHTML = domHtmlStr;
}
createDomWithes6();
