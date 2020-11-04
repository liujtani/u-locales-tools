const { stringify, parseLines } = require('dot-properties');

exports.parseLines = (text, doubleBackslash = false) => {
  if (doubleBackslash) {
    text = text.replace(/\\\\u/g, '\\u');
  }
  const lines = parseLines(text, false);
  let lastComments = [];
  let pairs = {}
  const obj = {};
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (Array.isArray(line)) {
      const item = {
        message: line[1]
      }
      if (lastComments.length > 0) {
        const comment = lastComments.join('\n')
        item.description = comment
        lastComments.forEach(c => {
          c = c.trim()
          const META = 'meta:'
          if (c.startsWith(META)) {
            const meta = parseLines(c.slice(META.length), false)
            if (Array.isArray(meta)) {
              meta.forEach(m => {
                item[m[0]] = item[m[1]]
              })
            }
          }
        })
      }
      pairs = obj[line[0]] = item;
      lastComments = []
    } else {
      lastComments.push(line)
    }
  }
  if (lastComments.length > 0) {
    pairs.footnote = lastComments.join('\n')
  }
  return obj;
};

exports.stringify = (obj, { unicode = false, doubleBackslash = false } = {}) => {
  let lines = []
  let footnote
  const keys = Object.keys(obj)
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const value = obj[key]
    if (value.description) {
      lines.push(value.description)
    }
    lines.push([key, value.message])
    if (value.footnote) {
      footnote = value.footnote
    }
  }
  if (footnote) {
    lines.push(footnote)
  }
  const str = stringify(lines, {
    lineWidth: null,
    newline: '\n',
    latin1: !unicode
  });
  return doubleBackslash ? str.replace(/\\u/g, '\\\\u') : str;
};
