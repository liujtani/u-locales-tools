const { seajs } = require('../parse-tool');

module.exports = [
  {
    name: 'umooc-mobile:portal',
    filetype: seajs,
    remotePath: 'mobile-portal.json',
    localPath: 'src/main/webapp/static/portal/locales/:locale.js',
    desc: '客户端app门户首页'
  },
  {
    name: 'umooc-mobile:quiz',
    remotePath: '测验_tea_zh.json',
    localPath: 'src/main/webapp/static/view/i18n/:locale.json',
    desc: '测验项目'
  }
];
