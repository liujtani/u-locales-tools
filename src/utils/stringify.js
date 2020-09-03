const { json, seajs, requirejs, properties, kindeditor, js, ckeditor } = require('./types');
const { stringify } = require('./properties');
const { format } = require('./format');

exports.stringify = (type, obj, contents, options) => {
  switch (type) {
    case json:
    case kindeditor:
      return JSON.stringify(obj, null, 2) + '\n';
    case requirejs:
    case seajs:
      const str = `define(${JSON.stringify(obj, null, 2)})\n`;
      return format(str);
    case js:
      return format('(' + JSON.stringify(obj) + ')');
    case properties:
      return stringify(obj, contents, options);
    case ckeditor:
      return format(`CKEDITOR.plugins.setLang('${obj.id}', '${obj.locale}', ${JSON.stringify(obj.message)})`);
    default:
      throw new Error('未知的type类型：' + type);
  }
};
