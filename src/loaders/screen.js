const { json } = require('../utils/types');

module.exports = {
  project: 'screen',
  type: json,
  remoteFilename: '投屏zh.json',
  localGlob: '../course_web/i18n/www/screen/src/src/locales/*.json',
  fileMap: ['{locale}.json'],
  desc: '投屏'
};
