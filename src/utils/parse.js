const { json, seajs, requirejs, properties, kindeditor, js, ckeditor, datepicker } = require('./types');
const { parse } = require('./properties');

global.define = (dep, def) => {
  if (!def) {
    def = dep;
  }
  if (typeof def !== 'function') {
    return def;
  } else {
    const result = def(require, exports, module);
    return result;
  }
};

global.CKEDITOR = {};
global.CKEDITOR.plugins = {};
global.CKEDITOR.plugins.setLang = function (id, locale, message) {
  return {
    id,
    locale,
    message
  };
};

exports.parse = (type, contents) => {
  let obj;
  switch (type) {
    case json:
    case kindeditor:
      obj = JSON.parse(contents);
      break;
    case seajs:
    case requirejs:
    case ckeditor:
      obj = eval(contents);
      break;
    case datepicker:
      eval(contents)
      // eslint-disable-next-line
      return $lang;
    case js:
      obj = eval('(' + contents + ')');
      break;
    case properties:
      return parse(contents);
    default:
      throw new Error('未知的type类型：' + type);
  }
  return obj;
};
