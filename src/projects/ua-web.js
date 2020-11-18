const { json } = require('../parse-tool');

module.exports = {
  name: 'ua_web',
  groups: [
    {
      name: 'main',
      src: 'src/common/lang/:locale.js',
      dst: 'ua_zh.js.json',
      srcType: json,
      desc: 'UA',
      dst2: 'src/learnCourse/common/lang'
    },
    {
      name: 'learnCourse',
      src: 'src/learnCourse/locales/:locale/message.json',
      dst: 'ua_message.json',
      srcType: json,
      desc: 'UA播放器内层'
    }
  ]
};
