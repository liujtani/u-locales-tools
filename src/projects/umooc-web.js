module.exports = {
  name: 'umooc-web',
  groups: [
    {
      src: 'src/main/resource/resources/message_:locale.properties',
      dst: 'message_zh_CN.properties',
      desc: 'java properties项目',
      localeMap: {
        templates: 'zh_CN',
        'zh-TW': 'zh_TW',
        en: 'en_US',
        th: 'th_TH',
        id: 'in_ID'
      }
    }
  ]
};
