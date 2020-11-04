const fs = require('fs');
const { requirejs } = require('../parse-tool');
const { getBasePath } = require('../utils/ptr');

let locales;

const getLocales = (task) => {
  if (locales) return locales;
  const dir = getBasePath(task.fullLocalPath)
  const dirlist = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((it) => it.isDirectory())
    .map((it) => it.name);
  return (locales = dirlist);
};

module.exports = [
  {
    name: 'course_web:main',
    filetype: requirejs,
    localPath: 'www/common/nls/:locale?/:basename.js',
    remotePath: '2.0_:basename.js.json',
    desc: '2.0 {filename}',
    localeMap: {
      templates: ''
    },
    fillTranstion: false,
    localHooks: {
      readed: function (item) {
        const { obj, locale } = item;
        if (locale === 'templates') {
          return obj.root;
        } else {
          return obj;
        }
      }
    },
    remoteHooks: {
      converted: function (item) {
        const { locale } = item;
        const locales = getLocales(this);
        let obj = item.obj
        if (locale === 'templates') {
          obj = {
            root: obj,
            ...locales.reduce((accu, curr) => {
              accu[curr] = true;
              return accu;
            }, {})
          };
        }
        return obj;
      }
    }
  },
  {
    name: 'course_web:screen',
    localPath: 'www/screen/src/src/locales/:locale.json',
    remotePath: '投屏zh.json',
    desc: '投屏'
  }
  // getCkeditor('course_web', 'www/common/vendor', ['imageUploader', 'simplelink'])
];
