const { datepicker, kindeditor } = require('../parse-tool');
const cloneDeep = require('lodash/cloneDeep');
const Path = require('path');
const log = require('../utils/log');
const { getProjectPath } = require('../utils/repo');

let _templateObj;

const groups = [
  {
    name: 'main',
    src: 'lang/:locale/:basename.json',
    dst: '1.0_:basename.js.json',
    desc: '1.0 {filename}.js'
  },
  {
    name: 'kindeditor',
    src: 'kindeditor_4.1.4/lang/:locale.js',
    dst: 'kindeditor.json',
    srcType: kindeditor,
    desc: 'kindeditor 编辑器组件',
    localeMap: {
      templates: 'zh_CN',
      'zh-TW': 'zh_TW'
    },
    omitKeys: [['fontname.fontName']]
  },
  {
    name: 'my97DatePicker',
    srcType: datepicker,
    src: 'js/My97DatePicker/lang/:locale.js',
    dst: 'my97DatePicker.json',
    desc: 'my97DatePicker 日期插件 适用于1.0项目',
    localeMap: {
      templates: 'zh-cn',
      'zh-TW': 'zh-tw'
    },
    fillTranslation: false,
    omitKeys: [['aLongWeekStr', 8]]
  },

  {
    name: 'mathJax',
    src: 'js/tutor/question/Que/formula/locales/:locale.json',
    dst: 'attachMathJax.json',
    desc: '对应公式编辑器页面',
    srcHooks: {
      readed: (item, task) => {
        const { srcObj, src } = item;
        const templateObj = _templateObj || cloneDeep(task.getSrcObj(src));
        _templateObj = templateObj;
        const convert = (key) => {
          const value = srcObj[key];
          const templateValue = templateObj[key];
          srcObj[key] = value.map((item, index) => {
            const templateItem = templateValue[index];
            if (templateItem.list.length !== item.list.length) {
              throw `${src} 的 ${key}.list 列表缺少项目元素，请补全后再继续转换`;
            }
            const object = {
              name: item.name,
              list: item.list.reduce((list, curr, index) => {
                let { name, tip, desc } = curr;
                const templateListItem = templateItem.list[index];
                const templateName = templateListItem.name;
                const obj = {};
                if (!/[\u4e00-\u9fa5]/.test(templateName)) {
                  name = '';
                }
                if (name && name.trim()) {
                  obj.name = name;
                }
                if (tip && tip.trim()) {
                  obj.tip = tip;
                }
                if (desc && desc.trim()) {
                  obj.desc = desc;
                }
                if (Object.keys(obj).length > 0) {
                  list[index] = obj;
                }
                return list;
              }, [])
            };
            if (item.desc && item.desc.trim()) {
              object.desc = item.desc;
            }
            return object;
          });
        };
        convert('symbols');
        convert('subjects');
        convert('formulas');
      }
    },
    dstHooks: {
      converted: (item) => {
        const { dstObj, locale } = item;
        const convert = (key) => {
          dstObj[key].forEach((value) => {
            const { list } = value;
            let index = 0;
            Object.keys(list).forEach((k) => {
              if (index !== +k) {
                log.error(`${locale}/attachMathJax.${key}：${k}不是一个数组索引，或者两个key之间存在间隙`);
                process.exit(1);
              }
              index += 1;
            });
          });
        };
        convert('symbols');
        convert('subjects');
        convert('formulas');
      }
    },
    dst2(config) {
      return [
        Path.join(getProjectPath(config, 'umooc_homework_front'), 'ulearning/static/3rdlib/ckeditor/plugins/attachMathJax/locales'),
        Path.join(getProjectPath(config, 'ua_web'), 'src/components/testEditor/formula/locales')
      ];
    }
  }
];

module.exports = {
  name: 'umooc-static',
  groups
};
