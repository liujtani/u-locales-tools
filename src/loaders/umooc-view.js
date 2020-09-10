const { getPath } = require('../utils/rc');

module.exports = [
  {
    project: 'umooc-view:face',
    localGlob: getPath('umooc-view', 'src/main/webapp/js/lang/*/*.json'),
    remoteGlob: '**/1.0_*[^.js].json',
    fileMap: ['{filename}/{locale}.json', '{locale}/1.0_{filename}.json'],
    localeMap: {
      templates: 'zh-cn',
      'zh-TW': 'zh-tw'
    },
    desc: ['{filename}/{locale}.json', '1.0 {filename}.json']
  },
  {
    project: 'umooc-view',
    localGlob: getPath('umooc-view', 'src/main/resources/resources/+(tutor_*.properties|learner_*.properties)'),
    remoteGlob: '*/+(tutor_zh.properties|learner_zh.properties)',
    fileMap: ['{prefix}_{locale}.properties', '{locale}/{prefix}_zh.properties'],
    localeMap: {
      id: 'in'
    },
    desc: 'java properties项目'
  }
];
