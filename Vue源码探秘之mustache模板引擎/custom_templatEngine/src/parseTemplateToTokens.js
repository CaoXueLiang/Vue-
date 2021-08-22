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
    tokes.push(["text", word]);
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

export default parseTemplateToTokens;
