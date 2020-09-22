const vm = require('vm');

const { json, seajs, requirejs, properties, kindeditor, js, ckeditor, datepicker } = require('./types');
const { parse } = require('./properties');

const defineContext = {
  define: (dep, def) => {
    if (!def) {
      def = dep;
    }
    if (typeof def !== 'function') {
      return def;
    } else {
      const result = def(require, exports, module);
      return result;
    }
  }
};

const ckeditorContext = {
  CKEDITOR: {
    plugins: {
      setLang: function (id, locale, message) {
        return {
          id,
          locale,
          message
        };
      }
    }
  }
};

exports.parse = (type, contents) => {
  let script;
  let obj;
  const context = {};
  const kindeditorContext = {
    KindEditor: {
      lang: function (message, locale) {
        this.message = message;
        this.locale = locale;
      }
    }
  };
  switch (type) {
    case json:
      obj = JSON.parse(contents);
      break;
    case seajs:
    case requirejs:
      script = new vm.Script(contents);
      obj = script.runInNewContext(defineContext);
      break;
    case ckeditor:
      script = new vm.Script(contents);
      obj = script.runInNewContext(ckeditorContext);
      break;
    case kindeditor:
      script = new vm.Script(contents);
      script.runInNewContext(kindeditorContext);
      obj = kindeditorContext.KindEditor.message;
      break;
    case datepicker:
      script = new vm.Script(contents);
      script.runInNewContext(context);
      obj = context.$lang;
      break;
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
