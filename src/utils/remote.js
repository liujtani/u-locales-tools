const Path = require('path')
const fs = require('fs')
const fsp = fs.promises
const last = require('lodash/last')
const { parse } = require('./parse')
const { remoteBasepath } = require('../config/index')
const { json, properties } = require('./types')

const getRemoteData = async (hasComment = true) => {
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
            const type = last(file.split('.')).toLowerCase();
            if (type !== json && type !== properties) {
              return
            }
            let obj
            try {
              obj = parse(type, content)
            } catch (e) {
              console.log(locale, file);
              throw e;
            }
            map[locale][file] = obj;
            if (!hasComment && type === 'json') {
              map[locale][file] = Object.keys(obj).reduce((accu, key) => {
                accu[key] = obj[key].message;
                return accu
              }, {});
            }
          })
      );
    })
  );
  return map
}

module.exports.getRemoteData = getRemoteData
