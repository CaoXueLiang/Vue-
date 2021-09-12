const regexp = /([a-z]+[1-6]?)\s*=\s*("[\w\s?]+")/g;
export default function (attributes) {
  let result = attributes.match(regexp);
  let resultData = result.map((item) => {
    item = item.replace(/\"/g, "");
    let tmpArray = item.split("=");
    return {
      name: tmpArray[0].trim(),
      value: tmpArray[1].trim(),
      type: "TextAttribute",
    };
  });
  return resultData;
}
