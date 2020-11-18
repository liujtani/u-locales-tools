const Path = require('path');
const { json, seajs, requirejs, properties, kindeditor, ckeditor, datepicker } = require('./types');
const { stringify } = require('./properties');
const { format } = require('./format');
const log = require('../utils/log');

const kindeditorCommonCode = `
if (typeof define === "function") {
  if (typeof KindEditor === "function") {
    KElang();
  } else {
    define(function (require, exports, module) {
      require("../kindeditor.js");
      KElang();
    });
  }
} else {
  KElang();
}
`;

const stringify2 = (obj, options) => {
  const { type } = options;
  switch (type) {
    case json:
      return JSON.stringify(obj, null, 2) + '\n';
    case seajs:
    case requirejs:
      return format(`define(${JSON.stringify(obj, null, 2)})`);
    case kindeditor:
      const locale = Path.basename(options.path, '.js');
      return format('var KElang = function () { KindEditor.lang(' + JSON.stringify(obj) + ', "' + locale + '")};' + kindeditorCommonCode);
    case datepicker:
      return format('var $lang = ' + JSON.stringify(obj));
    case properties:
      return stringify(obj, options);
    case ckeditor:
      return format(`CKEDITOR.plugins.setLang('${obj.id}', '${obj.locale}', ${JSON.stringify(obj.message)})`);
    default:
      throw new Error('未知的type：' + type);
  }
};

exports.stringify = (obj, options) => {
  try {
    return stringify2(obj, options);
  } catch (e) {
    log.error(`parse: 序列化${options.type} 的对象出错，要写入的路径为${options.path}, 错误信息为 ${e.message}`);
    console.log('序列化的对象如下所示：');
    console.log(obj);
    process.exit(1);
  }
};
