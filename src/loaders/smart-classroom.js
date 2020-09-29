const { getPath } = require('../utils/rc');

module.exports = {
  project: 'smart-classroom',
  remoteFilename: 'smartClass.json',
  localGlob: getPath('smart-classroom', 'src/locales/*.json'),
  fileMap: ['{locale}.json'],
  desc: 'smart-classroom 项目'
};
