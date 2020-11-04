const fs = require('fs');
const { isObject } = require('lodash');
const fsp = fs.promises;
const { properties, parse } = require('../parse-tool');
const { hasChinese } = require('../utils/extra');
const { serial, deserial } = require('../utils/serial');

module.exports.convertToRemote = async (task) => {
  const list = task.list;
  return Promise.all(
    list.map(async (item) => {
      if (task.beforeConvert) {
        task.beforeConvert(item, task);
      }
      const { dest, destType, locale } = item;
      let destObj;
      if (destType !== properties) {
        item.obj = serial(item.obj, !task.mergeLocal);
      }
      if (fs.existsSync(dest)) {
        const text = await fsp.readFile(dest, { encoding: 'utf-8' });
        destObj = parse(text, destType);
      }
      item.obj = Object.keys(item.obj).reduce((accu, key) => {
        const message = item.obj[key];
        if (locale === 'templates' || locale === 'zh-TW' || !hasChinese(message)) {
          accu[key] = Object.assign({}, destObj && destObj[key], {
            message: item.obj[key],
            description: (destObj && destObj[key] && destObj[key].description) || task.getDesc(item.from)
          });
        }
        return accu;
      }, {});
      if (task.converted) {
        item.obj = task.converted(item, task);
      }
      return item;
    })
  );
};

module.exports.convertToLocal = async (task) => {
  const list = task.list;
  return Promise.all(
    list.map(async (item) => {
      if (task.beforeConvert) {
        task.beforeConvert(item, task);
      }
      const { dest, destType } = item;
      const templatePath = task.getTemplatePath(dest);
      let templateObj;
      if (fs.existsSync(templatePath)) {
        const text = fs.readFileSync(templatePath, { encoding: 'utf-8' });
        templateObj = parse(text, destType);
      }
      item.templateObj = templateObj;
      item.templatePath = templatePath;
      item.obj = Object.keys(item.obj).reduce((accu, key) => {
        const value = item.obj[key];
        if (!isObject(value)) {
          console.error(item.from);
          console.error(key, value);
          throw new Error('上游文件格式不正确');
        }
        const { message, useOldValue, oldValue } = value;
        const v = useOldValue ? oldValue : message;
        accu[key] = v || '';
        return accu;
      }, {});
      if (destType !== properties) {
        item.obj = deserial(item.obj, task.mergeLocal && templateObj ? templateObj : undefined);
      }
      if (task.converted) {
        item.obj = task.converted(item, task);
      }
      return item;
    })
  );
};
