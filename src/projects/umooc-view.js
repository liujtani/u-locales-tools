module.exports = {
  name: 'umooc-view',
  groups: [
    {
      name: 'face',
      src: 'src/main/webapp/js/lang/:basename(speakingFaq|face|discussConvention)/:locale.json',
      dst: '1.0_:basename(speakingFaq|face|discussConvention).json',
      localeMap: {
        templates: 'zh-cn',
        'zh-TW': 'zh-tw'
      },
      desc: '1.0 {filename}'
    },
    {
      name: 'properties',
      src: 'src/main/resources/resources/:prefix(tutor|learner)_:locale.properties',
      dst: ':prefix(tutor|learner)_zh.properties',
      localeMap: {
        id: 'in'
      },
      desc: 'java properties项目'
    }
  ]
};
