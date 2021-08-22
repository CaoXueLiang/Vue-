class Scaner {
  constructor(templateStr) {
    this.templateStr = templateStr;
    this.pos = 0;
    this.trail = this.templateStr;
  }

  scan(tmpstr) {
    if (this.trail.startsWith(tmpstr)) {
      this.pos += tmpstr.length;
      this.trail = this.templateStr.substring(this.pos);
    }
  }

  scanUnitil(stopTag) {
    let pos_back = this.pos;
    while (!this.trail.startsWith(stopTag) && !this.endOfString()) {
      this.pos++;
      this.trail = this.templateStr.substring(this.pos);
    }
    return this.templateStr.substring(pos_back, this.pos);
  }

  endOfString() {
    return this.pos >= this.templateStr.length;
  }
}

export default Scaner;
