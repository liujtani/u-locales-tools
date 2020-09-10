const { getPath } = require('../utils/rc');

module.exports = {
  project: 'activity2',
  remoteFilename: 'apps.json',
  localGlob: getPath('activity2', 'src/common/lang/*.json'),
  fileMap: ['{locale}.json'],
  localeMap: {
    templates: 'zh-CN',
    'zh-TW': 'zh-TW'
  },
  desc: '小应用'
};
