const { json } = require('../utils/types');
const Path = require('path');
const merge = require('lodash/merge');
const fs = require('fs');

module.exports = {
  project: 'attachMathJax', // 项目名称
  type: json,
  remoteFilename: 'attachMathJax.json',
  localGlob: '../umooc/static/js/tutor/question/Que/formula/locales/*.json', // 本地文件glob
  fileMap: ['{locale}.json'],
  desc: '对应公式编辑器页面', // 上游文件字段的description，支持fileMap的写法
  otherDest: '../umooc_homework_front/i18n/ulearning/static/3rdlib/ckeditor/plugins/attachMathJax/locales', // 将生成的本地文件是否复制到其他地方
  localParseAfter: (file, obj) => {
    obj = Object.assign({}, obj);
    const seps = file.path.split(Path.sep);
    seps[seps.length - 1] = 'zh.json';
    const src = JSON.parse(fs.readFileSync(seps.join(Path.sep)).toString());
    const tr = (key) => {
      const value = obj[key];
      const srcValue = src[key];
      obj[key] = value.map((item, index) => {
        const srcItem = srcValue[index];
        const object = {
          name: item.name,
          list: item.list.reduce((list, curr, index) => {
            let { name, tip, desc } = curr;
            const srcName = srcItem.list[index].name;
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
  },
  // localSerialAfter: () => {},
  // localStringifyAfter: () => {},
  // remoteParseAfter: () => {},
  remoteDeserialAfter: (file, obj, src) => {
    return merge(src, obj);
  }
  // remoteStringifyAfter: () => {}
};
