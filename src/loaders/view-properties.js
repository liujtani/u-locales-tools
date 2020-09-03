const { properties } = require('../utils/types');

module.exports = {
  project: 'properties',
  type: properties,
  localGlob: '../umooc-view/i18n/src/main/resources/resources/+(tutor_*.properties|learner_*.properties)',
  remoteGlob: '*/+(tutor_zh.properties|learner_zh.properties)',
  fileMap: ['{prefix}_{locale}.properties', '{locale}/{prefix}_zh.properties'],
  localeMap: {
    id: 'in'
  },
  desc: 'java properties项目'
};
