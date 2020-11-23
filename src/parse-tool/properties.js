const { stringify, parseLines, parse } = require('dot-properties');

const unicode2Ascii = (str) => {
  let newStr = '';
  for (let i = 0; i < str.length; i++) {
    const s = str[i];
    const code = s.codePointAt(0);
    if (code > 0xffff) {
      throw new Error(`${s} -> ${code}: 暂不支持高位码点`);
    }
    newStr += code > 127 ? `\\u${code.toString(16).padStart(4, '0')}` : s;
  }
  return newStr;
};

exports.parseLines = (text) => {
  // if (doubleBackslash) {
  //   text = text.replace(/\\\\u/g, '\\u');
  // }
  const lines = parseLines(text, false);
  let lastComments = [];
  let pairs = {};
  const obj = {};
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (Array.isArray(line)) {
      let item = {
        message: line[1]
      };
      if (lastComments.length > 0) {
        const comment = lastComments.join('\n');
        item.description = comment;
        lastComments.forEach((c) => {
          c = c.trim();
          c = c.replace(/^#\s*/, '');
          const META = 'meta:';
          if (c.startsWith(META)) {
            const meta = parse(c.slice(META.length), false);
            item = Object.assign(meta, item);
          }
        });
      }
      pairs = obj[line[0]] = item;
      lastComments = [];
    } else {
      lastComments.push(line);
    }
  }
  if (lastComments.length > 0) {
    pairs.footnote = lastComments.join('\n');
  }
  return obj;
};

exports.stringify = (obj, { unicode = false, doubleBackslash = false } = {}) => {
  let lines = [];
  let footnote;
  const keys = Object.keys(obj);
  if (unicode) {
    keys.forEach((key) => {
      if (typeof obj[key].message === 'string') {
        obj[key].message = unicode2Ascii(obj[key].message);
      }
    });
  }
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const value = obj[key];
    if (value.description !== undefined) {
      const desc = value.description.split('\n').map((it) => it.trim());
      lines.push(...desc);
    }
    lines.push([key, !value.message && typeof value.message !== 'number' ? '' : value.message]);
    if (value.footnote) {
      footnote = value.footnote;
    }
  }
  if (footnote !== undefined) {
    lines.push(footnote);
  }
  const str =
    stringify(lines, {
      lineWidth: null,
      newline: '\n',
      latin1: false
    }).trim() + '\n';
  return !doubleBackslash ? str.replace(/\\\\u(?=[0-9a-f]{4})/g, '\\u') : str;
};
