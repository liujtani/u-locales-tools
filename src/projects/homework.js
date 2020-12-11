const Path = require('path')
module.exports = {
  name: 'umooc_homework_front',
  groups: [
    {
      dst: '个人作业_zh:part(part)?.json',
      src: 'ulearning/src/common/lang/:locale:part(part)?.json',
      desc: (src) => {
        if (Path.basename(src, '.json').endsWith('part')) {
          return '个人作业zh_part.json'
        } else {
          return '个人作业zh_js'
        }
      }
    }
  ]
};
