import lookUp from "./lookup";

function renderTemplate(tokes, data) {
  let totalStr = "";
  for (let index = 0; index < tokes.length; index++) {
    const element = tokes[index];
    const firstElement = element[0];
    const secondElement = element[1];
    if (firstElement === "text") {
      totalStr += element[1];
    } else if (firstElement === "name") {
      totalStr += lookUp(data, secondElement);
    } else if (firstElement === "#") {
      const thirdElement = element[2];
      totalStr += parseArray(thirdElement, data[secondElement]);
    } else if (firstElement === "/") {
    }
  }
  return totalStr;
}

function parseArray(tokens, dataArray) {
  let totalStr = "";
  for (let index = 0; index < dataArray.length; index++) {
    const element = dataArray[index];
    let result = renderTemplate(tokens, { ...element, ".": element });
    totalStr += result;
  }
  return totalStr;
}

export default renderTemplate;
