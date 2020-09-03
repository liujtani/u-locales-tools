const { json } = require('../utils/types');

module.exports = {
  project: 'umooc-view',
  type: json,
  localGlob: '../umooc-view/i18n/src/main/webapp/js/lang/*/*.json',
  remoteGlob: '**/1.0_*[^.js].json',
  fileMap: ['{filename}/{locale}.json', '{locale}/1.0_{filename}.json'],
  localeMap: {
    templates: 'zh-cn',
    'zh-TW': 'zh-tw'
  },
  desc: ['{filename}/{locale}.json', '1.0 {filename}.json']
};
