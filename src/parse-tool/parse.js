const vm = require('vm');

const { json, seajs, requirejs, properties, kindeditor, ckeditor, datepicker } = require('./types');
const { parseLines } = require('./properties');

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

exports.parse = (text, type, options) => {
  if (type === json) {
    return JSON.parse(text);
  } else if (type === seajs || type === requirejs) {
    if (!text) {
      return {}
    }
    const script = new vm.Script(text);
    return script.runInNewContext(defineContext);
  } else if (type === ckeditor) {
    const script = new vm.Script(text);
    return script.runInNewContext(ckeditorContext);
  } else if (type === kindeditor) {
    const kindeditorContext = {
      KindEditor: {
        lang: function (message, locale) {
          this.message = message;
          this.locale = locale;
        }
      }
    };
    const script = new vm.Script(text);
    script.runInNewContext(kindeditorContext);
    return kindeditorContext.KindEditor.message;
  } else if (type === datepicker) {
    const context = {};
    const script = new vm.Script(text);
    script.runInNewContext(context);
    return context.$lang;
  } else if (type === properties) {
    return parseLines(text, options && options.doubleBackslash);
  } else {
    throw new Error('未知的type：' + type);
  }
};
