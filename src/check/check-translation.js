const Path = require('path');
const fs = require('fs');
const fsp = fs.promises;
const { hasChinese } = require('../utils/extra');
const { getRepoRescourse } = require('../utils/repo');
const isEqual = require('lodash/isEqual');

function getInterpolation(str) {
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
          polation.add(key);
        }
      }
    }
    i++;
  }
  return polation;
}

const checkInterpolation = (source, target) => {
  const set1 = getInterpolation(source);
  const set2 = getInterpolation(target);
  return isEqual(set1, set2);
};

const checkTranslation = async (config, options) => {
  const { output } = options;
  const list = await getRepoRescourse(config.repoPath, false);
  const data = {
    unTranslatedFiles: [],
    unTranslatedKeys: {},
    hasChineseKeys: {},
    incorrectInterpolation: {}
  };
  const templates = list.filter((it) => it.locale === 'templates');
  const templatesMap = templates.reduce((accu, item) => {
    const basename = Path.basename(item.path);
    accu[basename] = item.obj;
    return accu;
  }, {});
  list.forEach((item) => {
    const { locale, path, obj } = item;
    if (locale === 'templates') return;
    const basename = Path.basename(path);
    const filekey = Path.join(locale, basename);
    if (!templatesMap[basename]) {
      data.unTranslatedFiles.push(filekey);
    } else {
      Object.keys(templatesMap[basename]).forEach((key) => {
        if (!obj[key]) {
          if (!data.unTranslatedKeys[filekey]) {
            data.unTranslatedKeys[filekey] = [];
          }
          data.unTranslatedKeys[filekey].push(key);
          return;
        }
        if (locale !== 'zh-TW' && hasChinese(obj[key])) {
          if (!data.hasChineseKeys[filekey]) {
            data.hasChineseKeys[filekey] = {};
          }
          data.hasChineseKeys[filekey][key] = { source: templatesMap[basename][key], value: obj[key] };
        }
        if (!checkInterpolation(templatesMap[basename][key], obj[key])) {
          if (!data.incorrectInterpolation[filekey]) {
            data.incorrectInterpolation[filekey] = {};
          }
          data.incorrectInterpolation[filekey][key] = { source: templatesMap[basename][key], value: obj[key] };
        }
      });
    }
  });
  if (!output) {
    console.log(JSON.stringify(data, null, 2) + '\n');
  } else {
    const dirname = Path.dirname(output);
    await fsp.mkdir(dirname, { recursive: true });
    await fsp.writeFile(output, JSON.stringify(data, null, 2) + '\n');
  }
};

module.exports.checkTranslation = checkTranslation;
