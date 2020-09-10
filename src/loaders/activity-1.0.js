
const { getPath } = require('../utils/rc')

module.exports = {
  project: 'activity1',
  remoteFilename: '小组作业ch.json',
  localGlob: getPath('activity1', '1.0/src/assets/language/*.json'),
  fileMap: ['{locale}.json'],
  localeMap: {
    templates: 'ch'
  },
  desc: '小组作业'
};
