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
const { merge } = require('../transform/merge');
const { getPath } = require('../utils/rc');

const courseWebPath = getPath('course_web', 'www/common/vendor/ckeditor/plugins');
const homeworkPath = getPath('homework', 'ulearning/static/3rdlib/ckeditor/plugins');
const uaPath = getPath('ua-web', 'src/common/lib/ckeditor/plugins')

const plugins = {
  attachMathJax: [homeworkPath],
  imageUploader: [courseWebPath, homeworkPath],
  simplelink: [courseWebPath, homeworkPath, uaPath],
  kityformula: [uaPath],
  addNotes: [uaPath],
  embedHtml: [uaPath]
};

const r2lLocaleMap = {
  'zh-TW': 'zh',
  templates: 'zh-cn'
};

const l2rLocaleMap = Object.entries(r2lLocaleMap).reduce((obj, [key, value]) => {
  obj[value] = key;
  return obj;
}, {});

const cliLocaleMap = {
  zh: 'zh-cn',
  tw: 'zh',
  templates: 'zh-cn'
}

const getLangPath = (name, path) => {
  return Path.posix.join(path, name, 'lang', '*.js');
};

const combine = async function (pluginName, pathArray, locales) {
  const map = {};
  await Promise.all(
    pathArray.map(async (path) => {
      const langPath = getLangPath(pluginName, path, locales);
      let files = await getGlobFiles(langPath);
      if ((locales && locales.length > 0)) {
        files = files.filter(file => {
          const locale = file.split('.')[0]
          return locales.includes(cliLocaleMap[locale] || locale)
        })
      }
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

module.exports.l2r = async (locales) => {
  const composite = {};
  await Promise.all(
    Object.keys(plugins).map(async (name) => {
      const obj = await combine(name, plugins[name], locales);
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
      if (!fs.existsSync(Path.dirname(remoteFile))) {
        await fsp.mkdir(Path.dirname(remoteFile), { recursive: true })
      }
      await fsp.writeFile(remoteFile, stringify(json, obj), { encoding: 'utf-8' });
    })
  );
};

module.exports.l2r.project = 'ckeditor'

const locales = ['zh-cn', 'zh', 'ar', 'en', 'es', 'id', 'th'];

module.exports.r2l = async ({ withMerge = false, excludeLocales = [] } = {}) => {
  let files = await getGlobFiles(Path.posix.join(remoteBasepath, '*', 'ckeditor.json'));
  if (excludeLocales.length > 0 ) {
    files = files.filter(file => {
      const locale = file.split('.')[0]
      return !excludeLocales.includes(cliLocaleMap[locale] || locale)
    })
  }
  const localFiles = {}
  await Promise.all(
    files.map(async (file) => {
      const obj = JSON.parse(await fsp.readFile(file, { encoding: 'utf-8' }));
      const seps = file.split('/');
      let locale = seps[seps.length - 2];
      locale = r2lLocaleMap[locale] || locale;
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
                localFiles[Path.resolve(file)] = text
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
                  await fsp.writeFile(file, newText, { encoding: 'utf-8' });
                  if ((localFiles[Path.resolve(file)] || text) !== newText) {
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

module.exports.r2l.project = 'ckeditor'
module.exports.project = 'ckeditor'