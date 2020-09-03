const Path = require('path');
const mergeWith = require('lodash/mergeWith');
const cloneDeep = require('lodash/cloneDeep');
const omitBy = require('lodash/omitBy');
const forEach = require('lodash/forEach');
const omit = require('lodash/omit');
const fs = require('fs');
const { getGlobFiles } = require('../utils/getGlobFiles');
const { parse } = require('../utils/parse');
const { stringify } = require('../utils/stringify');
const fsp = fs.promises;

const merge = (locale, defaultLocale, callback) => {
  return mergeWith(
    cloneDeep(defaultLocale),
    omitBy(locale, (value, key) => defaultLocale[key] === undefined),
    callback
  );
};

const mergeLocales = async (config) => {
  const { localGlob, type, localRegex, localLocaleMap, mergeCallback = () => {} } = config;
  let files = await getGlobFiles(localGlob);
  const map = {};

  const template = 'templates';
  // const minorTemplate = 'en';

  forEach(files, (file) => {
    const result = localRegex.exec(file);
    if (result === null) {
      console.error(file);
      console.error(localRegex);
      throw new Error('正则不匹配，无法查找到文件所属的locale');
    }
    const locale = result.groups.locale;
    const key = config.getCommonPart(file, () => '_');
    if (!map[key]) {
      map[key] = {};
    }
    const newLocale = localLocaleMap[locale] || locale;
    map[key][newLocale] = file;
  });
  return Promise.all(
    Object.keys(map).map(async (key) => {
      const locales = map[key];
      const templateFile = locales[template];
      const templateStr = await fsp.readFile(templateFile, { encoding: 'utf-8' });
      const templateObj = parse(type, templateStr);
      await Promise.all(
        Object.keys(omit(locales, [template])).map(async (locale) => {
          const file = locales[locale];
          const text = await fsp.readFile(file, { encoding: 'utf-8' });
          const obj = parse(type, text);
          const newText = stringify(type, merge(obj, templateObj, mergeCallback), text, { unicode: true });
          if (text !== newText) {
            await fsp.writeFile(file, newText, { encoding: 'utf-8' });
          }
          console.log(Path.relative('', file));
        })
      );
    })
  );
};

module.exports.mergeLocales = mergeLocales;
module.exports.merge = merge;
