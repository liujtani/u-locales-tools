const { seajs } = require('../parse-tool');

module.exports = {
  name: 'umooc-mobile',
  groups: [
    {
      name: 'portal',
      src: 'src/main/webapp/static/portal/locales/:locale.js',
      dst: 'mobile-portal.json',
      srcType: seajs,
      desc: '客户端app门户首页'
    },
    {
      name: 'quiz',
      src: 'src/main/webapp/static/view/i18n/tea_:locale.json',
      dst: '测验_tea_zh.json',
      desc: '测验项目'
    }
  ]
};
