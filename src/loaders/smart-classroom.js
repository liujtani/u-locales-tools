const { json } = require('../utils/types');

module.exports = {
  project: 'smart-classroom',
  type: json,
  remoteFilename: 'smart-classroom.json',
  localGlob: '../ulearning-travial/travial/*.json',
  fileMap: ['{locale}.json'],
  desc: 'smart-classroom 项目'
};
