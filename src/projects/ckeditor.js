const Path = require('path');
const fs = require('fs');
const fsp = fs.promises;
const forEach = require('lodash/forEach');
const omitBy = require('lodash/omitBy');
const invert = require('lodash/invert');
const mergeWith = require('lodash/mergeWith');
const cloneDeep = require('lodash/cloneDeep')
const { parse, stringify, ckeditor, json } = require('../parse-tool');
const { serial, deserial } = require('../utils/serial');
const uaWeb = require('./ua-web');
const courseWeb = require('./course_web');
const homework = require('./homework');
const { getProjectBasepath } = require('../tasks/load-tasks');
const { walk } = require('../utils/extra');

const applyLocaleMap = {
  'zh-TW': 'zh',
  templates: 'zh-cn'
};

const storeLocaleMap = invert(applyLocaleMap)

const getPlugins = (config) => {
  const courseWebPath = Path.join(getProjectBasepath(courseWeb, config), 'www/common/vendor/ckeditor/plugins');
  const homeworkPath = Path.join(getProjectBasepath(homework, config), 'ulearning/static/3rdlib/ckeditor/plugins');
  const uaPath = Path.join(getProjectBasepath(uaWeb, config), 'src/common/lib/ckeditor/plugins');
  return {
    attachMathJax: [homeworkPath],
    imageUploader: [courseWebPath, homeworkPath],
    simplelink: [courseWebPath, homeworkPath, uaPath],
    kityformula: [uaPath],
    addNotes: [uaPath],
    embedHtml: [uaPath]
  };
};

const getLocalFiles = async (path, plugin, config) => {
  const map = {
    'zh-TW': 'zh',
    templates: 'zh-cn'
  };
  const fullPath = Path.join(path, plugin, 'lang');
  const files = await fsp.readdir(fullPath, { withFileTypes: true });
  return files
    .filter((it) => it.isFile() || (it.isSymbolicLink() && Path.extname(it.name) === '.js'))
    .map((it) => Path.join(fullPath, it.name))
    .filter((file) => {
      const name = Path.basename(file, '.js');
      const locale = map[name] || locale;
      if (config.excludeLocales.has(locale)) return false;
      if (config.locales.size > 0 && !config.locales.has(locale)) return false;
      return true;
    });
};

const getRemoteFiles = (config) => {
  const { repoPath, locales, excludeLocales } = config;
  const files = [];
  walk(repoPath, (path) => {
    const locale = Path.basename(Path.dirname(path));
    if (excludeLocales.has(locale)) return;
    if (locales.size > 0 && !locales.has(locale)) return;
    if (Path.basename(path) === 'ckeditor.json') {
      files.push(path);
    }
  });
  return files;
};

const combine = async function (pluginName, paths, config) {
  const map = {};
  await Promise.all(
    paths.map(async (path) => {
      const files = await getLocalFiles(path, pluginName, config);
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

const store = async (config) => {
  const plugins = getPlugins(config);
  const composite = {};
  await Promise.all(
    Object.keys(plugins).map(async (name) => {
      const obj = await combine(name, plugins[name], config);
      await Promise.all(
        Object.keys(obj).map(async (key) => {
          const { data, files } = obj[key];
          let locale = key.split('.')[0].toLowerCase();
          locale = storeLocaleMap[locale] || locale;
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
      const remoteFile = Path.join(config.repoPath, locale, 'ckeditor.json');
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
        await fsp.mkdir(Path.dirname(remoteFile), { recursive: true });
      }
      await fsp.writeFile(remoteFile, stringify(json, obj), { encoding: 'utf-8' });
    })
  );
};

const apply = async (config) => {
  const files = getRemoteFiles(config);
  const locales = config.locales;
  const plugins = getPlugins(config);
  const fillTranslation = config.fillTranslation;
  const localFiles = {};
  await Promise.all(
    files.map(async (file) => {
      const obj = JSON.parse(await fsp.readFile(file, { encoding: 'utf-8' }));
      const seps = file.split('/');
      let locale = seps[seps.length - 2];
      locale = applyLocaleMap[locale] || locale;
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
                localFiles[Path.resolve(file)] = text;
              }
              const newText = stringify(ckeditor, { id, locale: localeId, message: value });
              if (newText !== text) {
                await fsp.writeFile(file, newText, { encoding: 'utf-8' });
                if (!fillTranslation) {
                  console.log(Path.relative('', file));
                }
              }
            })
          );
        })
      );
    })
  );
  if (fillTranslation) {
    await Promise.all(
      Object.keys(plugins).map(async (pluginName) => {
        await Promise.all(
          plugins[pluginName].map(async (path) => {
            const template = Path.join(path, pluginName, 'lang/zh-cn.js');
            const templateObj = parse(ckeditor, await fsp.readFile(template, { encoding: 'utf-8' }));
            const files = getLocalFiles(path, pluginName, config)
            const set = new Set(files.map((file) => Path.basename(file, '.js')));
            const notExistLocales = locales.filter((locale) => !set.has(locale));
            await Promise.all(
              files.map(async (file) => {
                if (Path.basename(file) !== 'zh-cn.js') {
                  const text = await fsp.readFile(file, { encoding: 'utf-8' });
                  const obj = parse(ckeditor, text);
                  const newText = stringify(ckeditor, { id: obj.id, locale: obj.locale, message: mergeWith(cloneDeep(templateObj.message), obj.message) });
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

module.exports = {
  standalone: true,
  name: 'ckeditor',
  start(config, direction) {
    if (direction) {
      store(config);
    } else {
      apply(config);
    }
  }
};
