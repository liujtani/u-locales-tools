const { parse, stringify } = require("properties");
const cloneDeep = require('lodash/cloneDeep')
const forEach = require('lodash/forEach')

exports.parse = (text) => {
  return parse(text, {
    path: false,
    namespaces: false,
    strict: true
  });
};

const convert = (str, cb) => {
  return [...str]
    .map((s) => {
      const code = s.codePointAt(0);
      if (code > 0xffff) {
        console.error(s);
        console.error(code);
        throw new Error("暂不支持高位码点");
      }
      return cb(code, s);
    })
    .join("");
};

const unicode2Ascii = (str) => {
  return convert(str, (code, s) => (code > 127 ? `\\u${code.toString(16).padStart(4, "0")}` : s));
};

exports.stringify = (obj, text, { unicode = false } = {}) => {
  const mode = text.includes("\r\n") ? "\r\n" : "\n";
  const lines = text.split(/\r\n|\n/);
  const map = new Map();
  let headers = [];
  let key = "";
  const set = new Set();
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trim = line.trim();
    if (!trim || trim.startsWith("#")) {
      if (key) {
        map.has(key) ? map.get(key).push(line) : map.set(key, [line]);
      } else {
        headers.push(line);
      }
    } else {
      key = line.split("=")[0].trim();
      if (set.has(key)) {
        console.warn('包含重复的key: ', key)        
      }
      set.add(key);
    }
  }
  
  if (unicode) {
    obj = cloneDeep(obj);
    forEach(obj, (v, k) => {
      obj[k] = typeof v === "string" ? unicode2Ascii(v) : v;
    });
  }

  const str = stringify(obj);
  const strLines = str.split(/\r\n|\n/);
  const result = [...headers];
  for (let i = 0; i < strLines.length; i++) {
    const line = strLines[i];
    const entries = line.split("=");
    result.push(line);
    let key = entries[0] && entries[0].trim();
    if (key && map.has(key)) {
      result.push(...map.get(key));
    }
  }
  return result.join(mode).replace(/\\\\u/g, "\\u");
};
