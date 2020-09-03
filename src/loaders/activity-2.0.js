const { json } = require('../utils/types');

module.exports = {
  project: 'app_2.0',
  type: json,
  remoteFilename: 'apps.json',
  localGlob: '../ulearning_mobile_2.0/i18n/src/common/lang/*.json',
  fileMap: ['{locale}.json'],
  localeMap: {
    templates: 'zh-CN',
    'zh-TW': 'zh-TW'
  },
  desc: '小应用'
};
