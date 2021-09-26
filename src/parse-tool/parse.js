const vm = require('vm');

const { json, seajs, requirejs, properties, kindeditor, ckeditor, datepicker, esModule } = require('./types');
const { parseLines } = require('./properties');
const chalk = require('chalk');
const log = require('../utils/log');

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

const parse = (text, options) => {
  const { type } = options;
  switch (type) {
    case json:
      return JSON.parse(text);
    case seajs:
    case requirejs:
      if (!text) {
        return {};
      }
      const requireScript = new vm.Script(text);
      return requireScript.runInNewContext(defineContext);
    case kindeditor:
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
    case datepicker:
      const context = {};
      const dateScript = new vm.Script(text);
      dateScript.runInNewContext(context);
      return context.$lang;
    case properties:
      return parseLines(text, options.doubleBackslash);
    case ckeditor:
      const ckeditorScript = new vm.Script(text);
      return ckeditorScript.runInNewContext(ckeditorContext);
    case esModule: // 注意：esModule 格式仅支持 export default {} 这种简单的格式
    {
      const context = {};
      const script = new vm.Script(`globalVar = ${text.replace('export default', '')}`);
      script.runInNewContext(context);
      return context.globalVar;
    }
    default:
      throw new Error('未知的type：' + type);
  }
};

exports.parse = (text, options) => {
  try {
    return parse(text, options);
  } catch (e) {
    log.error(`parse: 解析来自 ${options.path} 的 ${options.type} 的文本出错，错误信息为 ${e.message}`);
    console.log('解析的字符串如下所示：');
    console.log(chalk.green(text));
    process.exit(1);
  }
};
