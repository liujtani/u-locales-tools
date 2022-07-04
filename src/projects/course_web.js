const fs = require('fs');
const {
  requirejs
} = require('../parse-tool');
const Path = require('path');

let locales;

const getLocales = (basePath) => {
  if (locales) return locales;
  const path = Path.join(basePath, 'www/common/nls');
  const dirlist = fs
    .readdirSync(path, {
      withFileTypes: true
    })
    .filter((it) => it.isDirectory())
    .map((it) => it.name);
  return (locales = dirlist.filter((it) => it !== 'ru' && it !== 'pt' && it !== 'ug')); // 临时先过滤掉 fr ru pt ug
};

const groups = [{
    name: 'main',
    src: 'www/common/nls/:locale?/:basename.js',
    dst: '2.0_:basename.js.json',
    srcType: requirejs,
    desc: '2.0 {filename}',
    localeMap: {
      templates: ''
    },
    fillTranslation: false,
    srcHooks: {
      readed: (item) => {
        const {
          srcObj,
          locale
        } = item;
        console.log("item", item);
        if (locale === 'templates') {
          item.srcObj = srcObj.root;
        }
      }
    },
    dstHooks: {
      readed: (item) => {
        const {
          dstObj,
          locale
        } = item;
        if (locale === 'templates') {
          item.dstObj = dstObj.root;
        }
      },
      converted: (item, task) => {
        const {
          locale
        } = item;
        const locales = getLocales(task.dstBasePath);
        let dstObj = item.dstObj;
        if (locale === 'templates') {
          item.dstObj = {
            root: dstObj,
            ...locales.reduce((accu, curr) => {
              accu[curr] = true;
              return accu;
            }, {})
          };
        }
      }
    }
  },
  {
    name: 'screen',
    src: 'www/screen/src/src/locales/:locale.json',
    dst: '投屏zh.json',
    desc: '投屏'
  }
];

module.exports = {
  name: 'course_web',
  groups
};