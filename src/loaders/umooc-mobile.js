const { seajs } = require('../utils/types');
const { getPath } = require('../utils/rc');

module.exports = [
  {
    project: 'umooc-mobile:portal',
    type: seajs,
    remoteFilename: 'mobile-portal.json',
    localGlob: getPath('umooc-mobile', 'src/main/webapp/static/portal/locales/*.js'),
    fileMap: ['{locale}.js'],
    desc: '客户端app门户首页'
  },
  {
    project: 'umooc-mobile',
    remoteFilename: '测验_tea_zh.json',
    localGlob: getPath('umooc-mobile', 'src/main/webapp/static/view/i18n/*.json'),
    fileMap: ['tea_{locale}.json'],
    desc: '测验项目'
  }
];
