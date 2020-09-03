const { json } = require('../utils/types');

module.exports = {
  project: 'mobile-discussion',
  type: json,
  remoteFilename: '讨论_zh.json',
  localGlob: '../discussion/src/locales/*.json',
  fileMap: ['{locale}.json'],
  desc: '讨论'
};
