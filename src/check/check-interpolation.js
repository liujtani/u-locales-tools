const Path = require('path')
const fs = require('fs');
const fsp = fs.promises;
const isObjectLike = require('lodash/isObjectLike')
const isEqual = require('lodash/isEqual');
const { getRemoteData } = require('../utils/remote');

function getPolation(str) {
  const polation = new Set();
  let i = 0;
  while (i < str.length) {
    let s = str[i];
    if (s === '\\') {
      if (i < str.length && str[i + 1] === '{') {
        i++;
      }
    } else if (s === '{') {
      if (i + 1 < str.length) {
        i++;
        let n = str[i];
        let key = '';
        while (i < str.length && n !== '}') {
          key += n;
          i++;
          n = str[i];
        }
        key = key.trim();
        if (n === '}') {
          polation.add(key)
        }
      }
    }
    i++;
  }
  return polation;
}

const check = (obj, source, diff, compositeKey = '') => {
  if (isObjectLike(obj) && isObjectLike(source)) {
    Object.keys(obj).forEach((key) => {
      check(obj[key], source[key], diff, compositeKey + (Array.isArray(obj) ? `[${key}]` : `${compositeKey ? '.' : ''}${key}`));
    });
  } else if (typeof obj === 'string' && typeof source === 'string') {
    const polation1 = getPolation(obj);
    const polation2 = getPolation(source);
    if (!isEqual(polation1, polation2)) {
      diff[compositeKey] = {
        templates: source,
        local: obj
      };
    }
  }
};

module.exports.checkInterpolation = async (output) => {
  const map = getRemoteData(false)
  const templates = map.templates;
  const keys = Object.keys(map);
  for (let i = 0; i < keys.length; i++) {
    const locale = keys[i];
    if (locale === 'templates') continue;
    const fileMap = map[locale];
    const files = Object.keys(fileMap);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const diff = {};
      if (!templates[file]) continue;
      check(fileMap[file], templates[file], diff);
      if (Object.keys(diff).length > 0) {
        try {
          await fsp.mkdir(Path.join(output, locale));
        } catch (e) {}
        await fsp.writeFile(Path.join(output, locale, file), JSON.stringify(diff, null, 2) + '\n');
      }
    }
  }
};
