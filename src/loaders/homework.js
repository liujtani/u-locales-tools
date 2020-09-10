const { getPath } = require('../utils/rc');

module.exports = [
  {
    project: 'homework',
    remoteFilename: '个人作业_zh.json',
    localGlob: getPath('homework', 'ulearning/src/common/lang/!(*part).json'),
    fileMap: ['{locale}.json'],
    desc: '个人作业zh_js'
  },
  {
    project: 'homework',
    remoteFilename: '个人作业_zhpart.json',
    localGlob: getPath('homework', 'ulearning/src/common/lang/*part.json'),
    fileMap: ['{locale}part.json'],
    desc: '个人作业zh_part.json'
  }
];
