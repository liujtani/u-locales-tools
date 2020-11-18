const fs = require('fs');
const { requirejs } = require('../parse-tool');
const { getBasePath } = require('../utils/ptr');

let locales;

const getLocales = (basePath) => {
  if (locales) return locales;
  const dir = getBasePath(basePath);
  const dirlist = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((it) => it.isDirectory())
    .map((it) => it.name);
  return (locales = dirlist.filter(it => it !== 'fr' && it !== 'ru' && it !== 'pt')); // 临时先过滤掉 fr ru pt
};

const groups = [
  {
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
        const { srcObj, locale } = item;
        if (locale === 'templates') {
          item.srcObj = srcObj.root;
        }
      }
    },
    dstHooks: {
      readed: (item) => {
        const { dstObj, locale } = item;
        if (locale === 'templates') {
          item.dstObj = dstObj.root;
        }
      },
      converted: (item) => {
        const { locale, dst } = item;
        const locales = getLocales(dst);
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
