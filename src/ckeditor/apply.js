const Path = require('path');
const fs = require('fs');
const fsp = fs.promises;
const merge = require('lodash/merge');
const cloneDeep = require('lodash/cloneDeep');
const { parse, stringify, ckeditor, json } = require('../parse-tool');
const { deserial } = require('../utils/serial');
const { write, hasLocale } = require('../tasks/util');
const chalk = require('chalk');
const { logList, localeMap, sort } = require('./utils');
const { pickByTemplate } = require('../utils/extra');

const load = async (config) => {
  const { repoPath } = config;
  const list = [];
  const dirs = (await fsp.readdir(repoPath, { withFileTypes: true })).filter((it) => it.isDirectory()).map((it) => it.name);
  for (let i = 0; i < dirs.length; i++) {
    const locale = dirs[i];
    let hidden = locale === 'templates';
    if (hidden || hasLocale(locale, config)) {
      hidden = hidden && !hasLocale(locale, config);
      const files = (await fsp.readdir(Path.join(repoPath, locale), { withFileTypes: true }))
        .filter((it) => (it.isFile() || it.isSymbolicLink()) && it.name === 'ckeditor.json')
        .map((it) => it.name);
      files.forEach((file) => {
        list.push({ src: Path.join(repoPath, locale, file), locale, srcType: json, hidden });
      });
    }
  }
  return list;
};

const read = async (item, plugins) => {
  const { src, srcType, locale } = item;
  const filename = (localeMap[locale] || locale) + '.js';
  const text = await fsp.readFile(src, { encoding: 'utf-8' });
  const obj = parse(text, { type: srcType, path: src });
  const list = [];
  const newObj = {};
  Object.keys(obj).forEach((key) => {
    const seps = key.split('.');
    const pluginName = seps[0];
    if (!newObj[pluginName]) {
      newObj[pluginName] = {};
    }
    newObj[pluginName][seps.slice(1).join('.')] = obj[key];
  });
  await Promise.all(
    Object.keys(newObj).map(async (pluginName) => {
      const newItem = { ...item, plugin: pluginName, srcObj: newObj[pluginName], dstType: ckeditor };
      newItem.dst = plugins[pluginName].map((it) => Path.join(it.path, pluginName, 'lang', filename));
      const index = newItem.dst.findIndex((it) => fs.existsSync(it));
      if (index > -1) {
        const text = await fsp.readFile(newItem.dst[index], { encoding: 'utf-8' });
        newItem.dstObj = parse(text, { type: newItem.dstType, path: newItem.dst[index] }).message
      }
      list.push(newItem);
    })
  );
  return list;
};

const apply = async (config, cmdOptions, plugins) => {
  const list = await load(config);
  const newList = [];
  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    const groups = await read(item, plugins);
    newList.push(...groups);
  }
  sort(newList);
  if (cmdOptions.list) {
    logList(newList.filter((it) => !it.hidden));
    return;
  }
  for (let i = 0; i < newList.length; i++) {
    const item = newList[i];
    const { locale, plugin, dstObj, dst } = item;
    item.srcObj = Object.keys(item.srcObj).reduce((accu, key) => {
      const value = item.srcObj[key];
      accu[key] = (value && (value.oldValue || value.message)) || '';
      return accu;
    }, {});
    const dstTemplatePath = Path.join(Path.dirname(dst[0]), localeMap.templates + '.js');
    const index = newList.findIndex((it) => it.dst.includes(dstTemplatePath));
    const dstTemplateObj = index > -1 ? newList[index].dstObj : null

    item.srcObj = deserial(item.srcObj, dstTemplateObj);

    if (locale === 'templates') {
      if (dstObj && !item.hidden) {
        item.srcObj = merge(dstObj, item.srcObj);
      }
    } else {
      if (dstObj) {
        item.srcObj = merge(dstObj, item.srcObj);
      }
  
      if (dstTemplateObj) {
        item.srcObj = pickByTemplate(item.srcObj, dstTemplateObj);
        if (cmdOptions.fill) {
          item.srcObj = merge(cloneDeep(dstTemplateObj), item.srcObj);
        }
      }
    }

    if (!item.hidden) {
      item.dstObj = item.srcObj;
    }

    const srcLocale = localeMap[locale] || locale;
    item._obj = { message: item.srcObj, id: plugin, locale: srcLocale };
  }
  let count = 0;
  for (let i = 0; i < newList.length; i++) {
    const item = newList[i];
    if (item.hidden) continue;
    const { dst, _obj, dstType } = item;
    const text = stringify(_obj, { type: dstType, path: dst });
    for (let i = 0; i < dst.length; i++) {
      const dest = dst[i];
      const code = await write(dest, text);
      if (code) {
        count += 1;
      }
    }
  }
  console.log(chalk.green(`转换完成：${count > 0 ? '更改了' + count + '个文件' : '没有文件发生更改'}\n`));
};

module.exports.apply = apply;
