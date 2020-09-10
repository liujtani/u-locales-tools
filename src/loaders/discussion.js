const { getPath } = require('../utils/rc');

module.exports = {
  project: 'discussion',
  remoteFilename: '讨论_zh.json',
  localGlob: getPath('discussion', 'src/locales/*.json'),
  fileMap: ['{locale}.json'],
  desc: '讨论'
};
