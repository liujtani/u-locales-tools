const { getPath } = require('../utils/rc');

module.exports = {
  project: 'exam',
  remoteFilename: '手机考试zh.json',
  localGlob: getPath('exam', 'src/locales/*.json'),
  fileMap: ['{locale}.json'],
  desc: '手机考试zh.json'
};
