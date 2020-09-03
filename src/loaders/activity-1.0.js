const { json } = require('../utils/types');

module.exports = {
  project: 'app_1.0',
  type: json,
  remoteFilename: '小组作业ch.json',
  localGlob: '../ulearning_mobile_1.0/1.0/src/assets/language/*.json',
  fileMap: ['{locale}.json'],
  localeMap: {
    templates: 'ch'
  },
  desc: '小组作业'
};
