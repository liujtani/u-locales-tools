const { json } = require('../utils/types');

module.exports = {
  project: 'mobile-discussion',
  type: json,
  remoteFilename: '手机考试zh.json',
  localGlob: '../exam/trunk/src/locales/*.json',
  fileMap: ['{locale}.json'],
  desc: '手机考试zh.json'
};
