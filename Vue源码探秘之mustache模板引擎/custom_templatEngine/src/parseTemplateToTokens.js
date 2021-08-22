import Scaner from "./scaner";
import nestTokes from "./nestTokens";

function parseTemplateToTokens(template) {
  let tokes = [];
  let scaner = new Scaner(template);
  let word = "";
  while (!scaner.endOfString()) {
    //收集`{{`之前的word
    word = scaner.scanUnitil("{{");
    //跳过`{{`
    scaner.scan("{{");
    tokes.push(["text", trimBlank(word)]);
    word = scaner.scanUnitil("}}");
    scaner.scan("}}");
    if (word.length) {
      if (word.startsWith("#")) {
        tokes.push(["#", word.substring(1)]);
      } else if (word.startsWith("/")) {
        tokes.push(["/", word.substring(1)]);
      } else {
        tokes.push(["name", word]);
      }
    }
  }
  return nestTokes(tokes);
}

function trimBlank(word) {
  let _word = "";
  let isInnerElement = false;
  for (let index = 0; index < word.length; index++) {
    const element = word[index];
    if (element.startsWith("<")) {
      isInnerElement = true;
    } else if (element.startsWith(">")) {
      isInnerElement = false;
    }
    if (!isInnerElement) {
      _word += element.replace(/\s/g, "");
    }
    if (isInnerElement) {
      _word += element;
    }
  }

  return _word;
}

export default parseTemplateToTokens;
