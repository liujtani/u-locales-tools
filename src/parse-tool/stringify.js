const Path = require('path');
const { json, seajs, requirejs, properties, kindeditor, ckeditor, datepicker } = require('./types');
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

exports.stringify = (obj, type, options) => {
  let str = '';
  if (type === json) {
    return JSON.stringify(obj, null, 2) + '\n';
  } else if (type === seajs || type === requirejs) {
    str = `define(${JSON.stringify(obj, null, 2)})`;
    return format(str);
  } else if (type === kindeditor) {
    const locale = Path.basename(options.filepath, '.js');
    return format('var KElang = function () { KindEditor.lang(' + JSON.stringify(obj) + ', "' + locale + '")};' + kindeditorCommonCode);
  } else if (type === datepicker) {
    return format('var $lang = ' + JSON.stringify(obj));
  } else if (type === properties) {
    return stringify(obj, options) + '\n'
  } else if (type === ckeditor) {
    return format(`CKEDITOR.plugins.setLang('${obj.id}', '${obj.locale}', ${JSON.stringify(obj.message)})`);
  } else {
    throw new Error('未知的type：' + type);
  }
};
