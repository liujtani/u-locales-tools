const { datepicker, kindeditor } = require('../utils/types');
const { getPath } = require('../utils/rc');

module.exports = [
  {
    project: 'umooc-static',
    localGlob: getPath('umooc-static', 'lang/*/*.json'),
    remoteGlob: '**/1.0_*.js.json',
    fileMap: ['{locale}/{filename}.json', '{locale}/1.0_{filename}.js.json'],
    desc: ['{filename}.json', '1.0 {filename}.js']
  },
  {
    project: 'umooc-static:kindeditor',
    type: kindeditor,
    remoteFilename: 'kindeditor.json',
    localGlob: getPath('umooc-static', 'kindeditor_4.1.4/lang/*.js'),
    fileMap: ['{locale}.js'],
    desc: 'kindeditor 编辑器组件',
    localeMap: {
      templates: 'zh_CN',
      'zh-TW': 'zh_TW'
    },
    mergeLocal: true,
    localParseAfter: function (file, obj) {
      obj['fontname.fontName'] = undefined;
      return obj;
    },
    mergeCallback: (objValue, srcValue, key) => {
      if (key === 'fontname.fontName') {
        return srcValue;
      }
    }
  },
  {
    project: 'umooc-static:my97DatePicker',
    type: datepicker,
    remoteFilename: 'my97DatePicker.json',
    localGlob: getPath('umooc-static', 'js/My97DatePicker/lang/*.js'),
    fileMap: ['{locale}.js'],
    desc: 'my97DatePicker 日期插件 适用于1.0项目',
    localeMap: {
      templates: 'zh-cn',
      'zh-TW': 'zh-tw'
    },
    needMerge: false
  }
];
