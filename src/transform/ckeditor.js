const Path = require('path');
const { getGlobFiles } = require('../utils/getGlobFiles');
const { remoteBasepath } = require('../config/index');
const fs = require('fs');
const fsp = fs.promises;
const forEach = require('lodash/forEach');
const omitBy = require('lodash/omitBy');
const { parse } = require('../utils/parse');
const { stringify } = require('../utils/stringify');
const { ckeditor, json } = require('../utils/types');
const { serial, deserial } = require('../utils/serial');
const { merge } = require('./merge');

const courseWebPath = '../course_web/i18n/www/common/vendor/ckeditor/plugins';
const homeworkPath = '../umooc_homework_front/i18n/ulearning/static/3rdlib/ckeditor/plugins';

const plugins = {
  attachMathJax: [homeworkPath],
  imageUploader: [courseWebPath, homeworkPath],
  simplelink: [courseWebPath, homeworkPath]
};

const localeMap = {
  'zh-TW': 'zh',
  templates: 'zh-cn'
};

const l2rLocaleMap = Object.entries(localeMap).reduce((obj, [key, value]) => {
  obj[value] = key;
  return obj;
}, {});

const getLangPath = (name, path, onlyTemplate) => {
  return Path.posix.join(path, name, 'lang', onlyTemplate ? 'zh-cn.js' : '*.js');
};

const combine = async function (pluginName, pathArray, onlyTemplate) {
  const map = {};
  await Promise.all(
    pathArray.map(async (path) => {
      const langPath = getLangPath(pluginName, path, onlyTemplate);
      const files = await getGlobFiles(langPath);
      await Promise.all(
        files.map(async (file) => {
          const text = await fsp.readFile(file, { encoding: 'utf-8' });
          const basename = Path.basename(file);
          if (!Array.isArray(map[basename])) {
            map[basename] = [];
          }
          map[basename].push({
            path: file,
            data: parse(ckeditor, text)
          });
        })
      );
    })
  );
  const result = {};
  forEach(Object.keys(map), (key) => {
    const value = map[key];
    if (value.length === 0) return;
    let composite = value[0].data;
    for (let i = 1; i < value.length; i++) {
      const { path, data } = value[i];
      const warn = (field, name = field) => {
        console.warn(`plugin: ${pluginName} 在下面的文件中，plugin的 ${name} 字段不同，已跳过合并`);
        console.warn(`${path}: ${data[field]}`);
      };
      if (composite.id !== data.id) {
        warn('id', '插件id');
        return;
      }
      if (composite.locale !== data.locale) {
        warn('locale');
        return;
      }
      forEach(composite.message, (key) => {
        if (data.message[key] && composite.message[key] !== data.message[key]) {
          warn(key, 'message key值');
        }
      });
      Object.assign(
        composite.message,
        omitBy(data.message, (value, key) => {
          if (composite.message[key] !== undefined && value !== composite.message[key]) {
            return false;
          }
          return true;
        })
      );
    }
    const set = new Set();
    value.forEach(({ path }) => {
      set.add(Path.basename(path));
    });
    result[key] = {
      data: composite,
      files: [...set]
    };
  });
  return result;
};

module.exports.l2r = async (onlyTemplate = false) => {
  const composite = {};
  await Promise.all(
    Object.keys(plugins).map(async (name) => {
      const obj = await combine(name, plugins[name], onlyTemplate);
      await Promise.all(
        Object.keys(obj).map(async (key) => {
          const { data, files } = obj[key];
          let locale = key.split('.')[0].toLowerCase();
          locale = l2rLocaleMap[locale] || locale;
          if (!composite[locale]) {
            composite[locale] = {};
          }
          composite[locale][name] = data.message;
          const paths = [];
          files.forEach((file) => {
            plugins[name].forEach((path) => {
              paths.push(Path.join(path, name, 'lang', file));
            });
          });
          await Promise.all(
            paths.map(async (path) => {
              if (!fs.existsSync(Path.dirname(path))) {
                await fsp.mkdir(Path.dirname(path));
              }
              await fsp.writeFile(path, stringify(ckeditor, data), { encoding: 'utf-8' });
            })
          );
        })
      );
    })
  );
  await Promise.all(
    Object.keys(composite).map(async (locale) => {
      const obj = serial(composite[locale]);
      const remoteFile = Path.join(remoteBasepath, locale, 'ckeditor.json');
      let remoteObj = {};
      if (fs.existsSync(remoteFile)) {
        const text = await fsp.readFile(remoteFile, { encoding: 'utf-8' });
        remoteObj = JSON.parse(text);
      }
      forEach(obj, (value, key) => {
        obj[key] = {};
        obj[key].message = value;
        obj[key].description = remoteObj[key] && remoteObj[key].description ? remoteObj[key].description : 'ckeditor 插件';
      });
      await fsp.writeFile(remoteFile, stringify(json, obj), { encoding: 'utf-8' });
    })
  );
};

const locales = ['zh-cn', 'zh', 'ar', 'en', 'es', 'id', 'th'];

module.exports.r2l = async (withMerge = false) => {
  const files = await getGlobFiles(Path.posix.join(remoteBasepath, '*', 'ckeditor.json'));
  await Promise.all(
    files.map(async (file) => {
      const obj = JSON.parse(await fsp.readFile(file, { encoding: 'utf-8' }));
      const seps = file.split('/');
      let locale = seps[seps.length - 2];
      locale = localeMap[locale] || locale;
      const map = {};
      forEach(obj, ({ message }, key) => {
        const paris = key.split('.');
        const namespace = paris[0];
        if (!map[namespace]) {
          map[namespace] = {};
        }
        map[namespace][paris.slice(1).join('.')] = message;
      });
      forEach(map, (value, key) => {
        map[key] = deserial(value);
      });
      return Promise.all(
        Object.keys(plugins).map(async (pluginName) => {
          const value = map[pluginName];
          if (!value) {
            return;
          }
          return Promise.all(
            plugins[pluginName].map(async (file) => {
              file = Path.join(file, pluginName, 'lang', locale + '.js');
              let id = pluginName;
              let localeId = locale;
              let text;
              if (fs.existsSync(file)) {
                text = await fsp.readFile(file, { encoding: 'utf-8' });
                const obj = parse(ckeditor, text);
                id = obj.id;
                localeId = obj.locale;
              }
              const newText = stringify(ckeditor, { id, locale: localeId, message: value });
              if (newText !== text) {
                await fsp.writeFile(file, newText, { encoding: 'utf-8' });
                if (!withMerge) {
                  console.log(Path.relative('', file));
                }
              }
            })
          );
        })
      );
    })
  );
  if (withMerge) {
    await Promise.all(
      Object.keys(plugins).map(async (pluginName) => {
        await Promise.all(
          plugins[pluginName].map(async (path) => {
            const template = Path.join(path, pluginName, 'lang/zh-cn.js');
            const templateObj = parse(ckeditor, await fsp.readFile(template, { encoding: 'utf-8' }));
            const glob = getLangPath(pluginName, path);
            const files = await getGlobFiles(glob);
            const set = new Set(files.map((file) => Path.basename(file, '.js')));
            const notExistLocales = locales.filter((locale) => !set.has(locale));
            await Promise.all(
              files.map(async (file) => {
                if (Path.basename(file) !== 'zh-cn.js') {
                  const text = await fsp.readFile(file, { encoding: 'utf-8' });
                  const obj = parse(ckeditor, text);
                  const newText = stringify(ckeditor, { id: obj.id, locale: obj.locale, message: merge(obj.message, templateObj.message) });
                  if (text !== newText) {
                    await fsp.writeFile(file, newText, { encoding: 'utf-8' });
                    console.log(Path.relative('', file));
                  }
                }
              })
            );
            const basePath = Path.dirname(template);
            await Promise.all(
              notExistLocales.map(async (locale) => {
                const path = Path.join(basePath, locale + '.js');
                await fsp.writeFile(path, stringify(ckeditor, { id: templateObj.id, locale, message: templateObj.message }));
                console.log(Path.relative('', path));
              })
            );
          })
        );
      })
    );
  }
};
