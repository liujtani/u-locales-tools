const { remoteBasepath } = require('../config/index');
const fs = require('fs');
const Path = require('path');
const fsp = fs.promises;
const last = require('lodash/last');
const omit = require('lodash/omit');
const { parse } = require('../utils/parse');

module.exports.checkRemoteKey = async () => {
  const list = await fsp.readdir(remoteBasepath, { withFileTypes: true });
  const locales = list.filter((it) => it.isDirectory()).map((it) => it.name);
  const map = {};
  await Promise.all(
    locales.map(async (locale) => {
      const localeDir = Path.join(remoteBasepath, locale);
      const files = await fsp.readdir(localeDir, { withFileTypes: true });
      map[locale] = {};
      await Promise.all(
        files
          .filter((it) => it.isFile() || it.isSymbolicLink())
          .map((it) => it.name)
          .map(async (file) => {
            const filepath = Path.join(localeDir, file);
            const content = await fsp.readFile(filepath, { encoding: 'utf-8' });
            const type = last(file.split('.'));
            try {
              map[locale][file] = parse(type, content);
            } catch (e) {
              console.log(locale, file);
              throw e;
            }
          })
      );
    })
  );
  const files = new Set();
  Object.keys(omit(map, ['templates'])).forEach((locale) => {
    Object.keys(map[locale]).forEach((file) => {
      if (!map.templates[file]) {
        files.add(file);
        return;
      }
      const arr = [];
      Object.keys(map[locale][file]).forEach((key) => {
        if (!map.templates[file][key]) {
          arr.push(key);
        }
      });
      if (arr.length > 0) {
        console.log(`${locale} - ${file}`);
        console.log(arr.join('    '));
        console.log('\n');
      }
    });
  });
  if (files.size > 0) {
    console.log('缺少的文件有：');
    console.log([...files].join('    '));
    console.log('\n');
  }
};
