const last= require('lodash/last');
const { requirejs } = require('../utils/types');
const Path = require('path');
const fs = require('fs');
const { remoteBasepath } = require('../config');

const locales = fs
  .readdirSync(Path.resolve(remoteBasepath), { withFileTypes: true })
  .filter((it) => it.isDirectory())
  .filter((it) => it.name !== 'templates')
  .map((it) => it.name)
  .map((it) => {
    return it === 'zh-TW' ? 'tw' : it;
  });

module.exports = {
  project: 'course_web:nls',
  type: requirejs,
  localGlob: '../course_web/i18n/www/common/nls/**/*.js',
  remoteGlob: '**/2.0_*.js.json',
  fileMap: ['{locale}/{filename}', '{locale}/2.0_{filename}.json'],
  desc: ['{filename}', '2.0 {filename}'],
  localeMap: {
    templates: ''
  },
  localLocaleMap: {
    nls: 'templates'
  },
  needMerge: false,
  localParseAfter: function (file, obj) {
    if (last(Path.dirname(file.path).split(Path.sep)) === 'nls') {
      return obj.root;
    } else {
      return obj;
    }
  },
  remoteDeserialAfter: function (file, obj, src, hasLocalPath) {
    const seps = file.path.split(Path.sep);
    if (seps[seps.length - 2] === 'templates') {
      if (hasLocalPath) {
        obj = Object.assign({}, src, { root: obj });
      } else {
        obj = {
          root: obj,
          ...locales.reduce((accu, curr) => {
            accu[curr] = true;
            return accu;
          }, {})
        };
      }
    }
    return obj;
  }
};
