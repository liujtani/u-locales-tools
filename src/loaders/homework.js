const { json } = require('../utils/types');

module.exports = [
  {
    project: 'personal-homework',
    type: json,
    remoteFilename: '个人作业_zh.json',
    localGlob: '../umooc_homework_front/i18n/ulearning/src/common/lang/!(*part).json',
    fileMap: ['{locale}.json'],
    desc: '个人作业zh_js'
  },
  {
    project: 'personal-homework',
    type: json,
    remoteFilename: '个人作业_zhpart.json',
    localGlob: '../umooc_homework_front/i18n/ulearning/src/common/lang/*part.json',
    fileMap: ['{locale}part.json'],
    desc: '个人作业zh_part.json'
  }
];
