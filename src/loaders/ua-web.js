const { json } = require('../utils/types');
const { getPath } = require('../utils/rc');

module.exports = [
  {
    project: 'ua-web',
    type: json,
    remoteFilename: 'ua_zh.js.json',
    localGlob: getPath('ua-web', 'src/common/lang/*.js'),
    fileMap: ['{locale}.js'],
    desc: 'UA',
    otherDest: getPath('ua-web', 'src/learnCourse/common/lang')
  },
  {
    project: 'ua-web:learnCourse',
    type: json,
    remoteFilename: 'ua_message.json',
    localGlob: getPath('ua-web', 'src/learnCourse/locales/*/message.json'),
    fileMap: ['{locale}/message.json'],
    desc: 'UA播放器内层'
  }
];
