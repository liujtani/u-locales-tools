const { json } = require('../utils/types');

module.exports = [
  {
    project: 'ua-web',
    type: json,
    remoteFilename: 'ua_zh.js.json',
    localGlob: '../ua_web/bugfix-2.4/src/common/lang/*.js',
    fileMap: ['{locale}.js'],
    desc: 'UA'
  },
  {
    project: 'ua-web:message',
    type: json,
    remoteFilename: 'ua_message.json',
    localGlob: '../ua_web/bugfix-2.4/src/learnCourse/locales/*/message.json',
    fileMap: ['{locale}/message.json'],
    desc: 'UA播放器内层'
  }
];
