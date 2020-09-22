const Path = require('path')
const { json, seajs, requirejs, properties, kindeditor, js, ckeditor, datepicker } = require('./types');
const { stringify } = require('./properties');
const { format } = require('./format');

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

exports.stringify = (type, obj, contents, options) => {
  switch (type) {
    case json:
      return JSON.stringify(obj, null, 2) + '\n';
    case requirejs:
    case seajs:
      const str = `define(${JSON.stringify(obj, null, 2)})\n`;
      return format(str);
    case js:
      return format('(' + JSON.stringify(obj) + ')');
    case kindeditor:
      const locale = Path.basename(options.filepath, '.js')
      return format('var KElang = function () { KindEditor.lang(' + JSON.stringify(obj) + ', "' + locale + '")};' + kindeditorCommonCode);
    case datepicker:
      return format('var $lang = ' + JSON.stringify(obj));
    case properties:
      return stringify(obj, contents, options);
    case ckeditor:
      return format(`CKEDITOR.plugins.setLang('${obj.id}', '${obj.locale}', ${JSON.stringify(obj.message)})`);
    default:
      throw new Error('未知的type类型：' + type);
  }
};
