const { json } = require('../utils/types');

module.exports = {
  project: 'umooc-static',
  type: json,
  localGlob: '../umooc-static/i18n/lang/*/*.json',
  remoteGlob: '**/1.0_*.js.json',
  fileMap: ['{locale}/{filename}.json', '{locale}/1.0_{filename}.js.json'],
  desc: ['{filename}.json', '1.0 {filename}.js']
};
