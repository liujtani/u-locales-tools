module.exports = {
  name: 'ulearning_mobile_2.0',
  groups: [
    {
      src: 'src/common/lang/:locale.json',
      dst: 'apps.json',
      localeMap: {
        templates: 'zh-CN',
        'zh-TW': 'zh-TW'
      },
      desc: '小应用'
    }
  ]
};
