const { properties } = require('../utils/types');

module.exports = {
  project: 'properties',
  type: properties,
  remoteFilename: 'message_zh_CN.properties',
  localGlob: '../umooc-web/test/src/main/resource/resources/message_*.properties',
  fileMap: ['message_{locale}.properties'],
  desc: 'java properties项目',
  localeMap: {
    templates: 'zh_CN',
    'zh-TW': 'zh_TW',
    en: 'en_US',
    th: 'th_TH',
    id: 'in_ID'
  }
};
