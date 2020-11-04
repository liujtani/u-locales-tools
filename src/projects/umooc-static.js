const { datepicker, kindeditor } = require('../parse-tool');
const Path = require('path');
const merge = require('lodash/merge');
const fs = require('fs');
const { parse } = require('../parse-tool');
const homework = require('./homework');

module.exports = [
  {
    name: 'umooc-static:main',
    localPath: 'lang/:locale/:basename.json',
    remotePath: '1.0_:basename.js.json',
    desc: '1.0 {basename}.js'
  },
  {
    name: 'umooc-static:kindeditor',
    filetype: kindeditor,
    remotePath: 'kindeditor.json',
    localPath: 'kindeditor_4.1.4/lang/:locale.js',
    desc: 'kindeditor 编辑器组件',
    localeMap: {
      templates: 'zh_CN',
      'zh-TW': 'zh_TW'
    },
    mergeLocal: true,
    readed: function (file, obj) {
      obj['fontname.fontName'] = undefined;
      return obj;
    },
    remoteDeserialPost: (objValue, srcValue, key) => {
      if (key === 'fontname.fontName') {
        return srcValue;
      }
    }
  },
  {
    name: 'umooc-static:my97DatePicker',
    filetype: datepicker,
    remotePath: 'my97DatePicker.json',
    localPath: 'js/My97DatePicker/lang/:locale.js',
    desc: 'my97DatePicker 日期插件 适用于1.0项目',
    localeMap: {
      templates: 'zh-cn',
      'zh-TW': 'zh-tw'
    },
    fillTranstion: false
  },

  {
    name: 'umooc-static:mathJax',
    localPath: 'js/tutor/question/Que/formula/locales/:locale.json',
    remotePath: 'attachMathJax.json',
    desc: '对应公式编辑器页面', // 上游文件字段的description，支持fileMap的写法
    localHooks: {
      readed: (item, task) => {
        const { obj, from } = item;
        const templatePath = task.getTemplatePath(from);
        const src = JSON.parse(fs.readFileSync(templatePath, { encoding: 'utf-8' }));
        const tr = (key) => {
          const value = obj[key];
          const srcValue = src[key];
          obj[key] = value.map((item, index) => {
            const srcObj = srcValue[index];
            if (srcObj.list.length !== item.list.length) {
              throw `${from} 的 ${key}.list 列表缺少项目元素，请补全后再继续转换`
            }
            const object = {
              name: item.name,
              list: item.list.reduce((list, curr, index) => {
                let { name, tip, desc } = curr;
                const srcItem = srcObj.list[index];
                const srcName = srcItem.name;
                const obj = {};
                if (!/[\u4e00-\u9fa5]/.test(srcName)) {
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
              }, {})
            };
            if (item.desc && item.desc.trim()) {
              object.desc = item.desc;
            }
            return object;
          });
        };
        tr('symbols');
        tr('subjects');
        tr('formulas');
        return obj;
      }
    },
    remoteHooks: {
      converted: (item) => {
        const { templatePath, templateObj, dest, destType, obj } = item;
        let src;
        if (dest === templatePath) {
          src = templateObj;
        } else {
          if (fs.existsSync(dest)) {
            src = parse(fs.readFileSync(dest, { encoding: 'utf-8' }), destType);
          } else {
            src = templateObj;
          }
        }
        return merge(src, obj);
      }
    },
    get copyToOther () {
      return Path.join(homework.basePath, 'ulearning/static/3rdlib/ckeditor/plugins/attachMathJax/locales')
    }
  }
];
