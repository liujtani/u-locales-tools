const { esModule } = require('../parse-tool/types')

module.exports = {
  name: 'zambia-admin',
  groups: [
    {
      src: 'locales/:locale.js',
      dst: 'zambia-admin.json',
      desc: '赞比亚项目后台管理',
      srcType: esModule
    }
  ]
};
