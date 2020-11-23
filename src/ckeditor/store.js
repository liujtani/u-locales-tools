const Path = require('path');
const fs = require('fs');
const fsp = fs.promises;
const chalk = require('chalk');
const { parse, stringify, ckeditor, json } = require('../parse-tool');
const { serial } = require('../utils/serial');
const { write, hasLocale } = require('../tasks/util');
const { hasChinese } = require('../utils/extra');
const { logList, invertLocaleMap, sort } = require('./utils');
const pickBy = require('lodash/pickBy');

const load = async (config, plugins) => {
  const pluginKeys = Object.keys(plugins);
  pluginKeys.forEach((name) => {
    plugins[name] = plugins[name][0];
  });
  const list = [];
  for (let i = 0; i < pluginKeys.length; i++) {
    const pluginName = pluginKeys[i];
    const pluginItem = plugins[pluginName];
    const fullPath = Path.join(pluginItem.path, pluginName, 'lang');
    const files = (await fsp.readdir(fullPath, { withFileTypes: true }))
      .filter((it) => {
        return (it.isFile() || it.isSymbolicLink()) && Path.extname(it.name) === '.js';
      })
      .map((it) => it.name);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const basename = Path.basename(file, '.js');
      const locale = invertLocaleMap[basename] || basename;
      let hidden = locale === 'templates';
      if (hidden || hasLocale(locale, config)) {
        hidden = hidden && !hasLocale(locale, config);
        list.push({
          locale,
          src: Path.join(fullPath, file),
          dst: Path.join(config.repoPath, locale, 'ckeditor.json'),
          srcType: ckeditor,
          dstType: json,
          plugin: pluginName,
          hidden
        });
      }
    }
  }
  return list;
};

const read = async (item) => {
  const { src, plugin, srcType, dst, dstType } = item;
  const text = await fsp.readFile(src, { encoding: 'utf-8' });
  const obj = parse(text, { type: srcType, path: src });
  const message = serial(obj.message);
  const newMessage = {};
  Object.keys(message).forEach((key) => {
    newMessage[plugin + '.' + key] = message[key];
  });
  item.srcObj = newMessage;
  if (fs.existsSync(dst)) {
    item.dstObj = parse(await fsp.readFile(dst, { encoding: 'utf-8' }), { type: dstType, path: dst });
  }
};

const contact = (list) => {
  const newList = [];
  const map = {};
  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    const { locale } = item;
    if (!map[locale]) {
      map[locale] = [];
    }
    map[locale].push(item);
  }
  Object.keys(map).forEach((locale) => {
    const arr = map[locale];
    const obj = arr.slice(1).reduce(
      (accu, item) => {
        accu.srcObj = Object.assign(accu.srcObj, item.srcObj);
        accu.src.push(item.src);
        return accu;
      },
      { ...arr[0], src: [arr[0].src] }
    );
    newList.push(obj);
  });
  return newList;
};

const store = async (config, cmdOptions, plugins) => {
  const list = await load(config, plugins);

  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    await read(item);
  }

  const newList = contact(list);
  sort(newList);
  if (cmdOptions.list) {
    logList(newList.filter((it) => !it.hidden));
    return;
  }

  for (let i = 0; i < newList.length; i++) {
    const item = newList[i];
    const { dst, dstType, locale, dstObj = {} } = item;
    if (item.hidden) continue;
    const containChinese = (message) => {
      return locale !== 'templates' && locale !== 'zh-TW' && hasChinese(message);
    };
    const path = Path.join(config.repoPath, 'templates', 'ckeditor.json');
    const srcTemplateObj = newList.find((it) => it.dst === path);
    if (srcTemplateObj) {
      item.srcObj = pickBy(item.srcObj, (_, k) => srcTemplateObj.srcObj[k]);
    }
    const srcObj = item.srcObj;
    item.dstObj = Object.keys(srcObj).reduce((accu, key) => {
      if (!containChinese(srcObj[key])) {
        accu[key] = {
          message: dstObj[key] && dstObj[key].oldValue === srcObj[key] ? dstObj[key].message : srcObj[key],
          description: dstObj[key] ? dstObj[key].description : 'ckeditor 插件'
        };
      }
      return accu;
    }, {});
    item.text = stringify(item.dstObj, { type: dstType, path: dst });
  }
  if (cmdOptions.dryRun) return;
  let count = 0;
  for (let i = 0; i < newList.length; i++) {
    const item = newList[i];
    if (item.hidden) continue;
    const code = await write(item.dst, item.text);
    if (code) {
      count += 1;
    }
  }
  console.log(chalk.green(`转换完成：${count > 0 ? '更改了' + count + '个文件' : '没有文件发生更改'}\n`));
};

module.exports.store = store;
