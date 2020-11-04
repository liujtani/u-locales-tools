const Path = require('path');
const { json } = require('../parse-tool');

module.exports = [
  {
    name: 'ua_web',
    filetype: json,
    remotePath: 'ua_zh.js.json',
    localPath: 'src/common/lang/:locale.js',
    desc: 'UA',
    get copyToOther() {
      return Path.join(this.basePath, 'src/learnCourse/common/lang');
    }
  },
  {
    name: 'ua_web:learnCourse',
    filetype: json,
    remotePath: 'ua_message.json',
    localPath: 'src/learnCourse/locales/:locale/message.json',
    desc: 'UA播放器内层'
  }
];
