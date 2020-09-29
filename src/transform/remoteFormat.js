const forEach = require('lodash/forEach');
const { containsChinese } = require('../utils/extra')

const warn = (ref, key, path) => {
  if (!ref || !ref[key]) return;
  if (!ref[key].message) {
    console.warn(`warn: ${path} ${key} 字段的 message 属性不存在`);
  }
  if (!ref[key].description) {
    console.warn(`warn: ${path} ${key} 字段的 description 属性不存在`);
  }
};

module.exports.transToRemoteFormat = (options) => {
  const { src, locale, ref, path, config } = options;
  const obj = {};
  const filterChinese = locale !== 'templates' && locale !== 'zh-TW'
  forEach(src, (value, key) => {
    if ((typeof value === 'string' || typeof value === 'number')) {
      if ((filterChinese && containsChinese(value))) return
      warn(ref);
      obj[key] = Object.assign({}, ref && ref[key], {
        message: value
      });
      if (!obj[key].description) {
        obj[key].description = config.getDesc(path);
      }
    }
  });
  return obj
};
