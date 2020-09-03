const { seajs, json } = require('../utils/types');

module.exports = [
  {
    project: 'mobile-portal',
    type: seajs,
    remoteFilename: 'mobile-portal.json',
    localGlob: '../umooc-mobile/test/src/main/webapp/static/portal/locales/*.js',
    fileMap: ['{locale}.js'],
    desc: '客户端app门户首页'
  },
  {
    project: 'umooc-modile',
    type: json,
    remoteFilename: '测验_tea_zh.json',
    localGlob: '../umooc-mobile/test/src/main/webapp/static/view/i18n/*.json',
    fileMap: ['tea_{locale}.json'],
    desc: '测验项目'
  }
];
