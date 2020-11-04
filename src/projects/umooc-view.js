module.exports = [
  {
    name: 'umooc-view:face',
    localPath: 'src/main/webapp/js/lang/:locale/:basename.json',
    remotePath: '1.0_:basename([^/]+?(?<!\\.js)).json',
    localeMap: {
      templates: 'zh-cn',
      'zh-TW': 'zh-tw'
    },
    desc: '1.0 {filename}'
  },
  {
    name: 'umooc-view:prop',
    localPath: 'src/main/resources/resources/:prefix(tutor|learner)_:locale.properties',
    remotePath: ':prefix([^/]+?)_zh.properties',
    localeMap: {
      id: 'in'
    },
    desc: 'java properties项目'
  }
];
