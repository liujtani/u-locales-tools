const Path = require('path');
const fs = require('fs');
const fsp = fs.promises;
const template = require('lodash/template');
const mergeWith = require('lodash/mergeWith');
const cloneDeep = require('lodash/cloneDeep');
const { parse, stringify } = require('../parse-tool');

const { walk } = require('../utils/extra');
const ptr = require('../utils/ptr');
const invert = require('lodash/invert');
const { convertToRemote, convertToLocal } = require('./convert');
// const { getConfig } = require('../config');

class Task {
  constructor(option) {
    this.$options = option;
    this.name = option.name; // 项目的名称，关联配置文件中的 projects[name]
    this.filetype = option.filetype; // 文件类型，自动从扩展名获得，不过有些扩展名可能不准确，也支持手动指定
    this.fillTranstion = option.fillTranstion !== false; // 是否支持使用中文补全翻译，默认补全，大多数项目都需要不全翻译，但也有的项目不需要，例如course-web项目
    this.fillTranstionFn = option.fillTranstionFn; // 补全时，支持传入一个自定义函数
    this.mergeLocal = option.mergeLocal || false; // 是否需要参考本地文件的格式生成文件
    this.mergeLocalFn = option.mergeLocalFn;

    this.basePath = option.basePath; // 项目的基础路径
    this.localPath = option.localPath.replace(/\\/g, '/'); // 本地的pathRegex
    this.fullLocalPath = Path.posix.join(this.basePath, this.localPath).replace(/\\/g, '/');
    // const pattern = this.localPath.match(/:locale(\([\s\S]*\))?\?/) ? '/:locale?' : '/:locale';
    this.remotePath = Path.posix.join('/:locale', option.remotePath || this.name).replace(/\\/g, '/');
    // this.fullRemotePath = Path.posix.join(config.repoPath, this.remotePath).replace(/\\/g, '/'); // 远程的pathRegex
    this.desc = option.desc;
    this.remoteLocaleMap = Object.assign(
      {
        templates: 'zh',
        'zh-TW': 'tw'
      },
      option.localeMap
    );
    this.localLocaleMap = invert(this.remoteLocaleMap);

    this.doubleBackslash = option.doubleBackslash; // properties 文件才需要这个属性
  }

  async start(config, direction) {
    this.config = config;
    this.direction = !!direction; // local -> remote: true remote -> local: false
    this.fullRemotePath = Path.posix.join(config.repoPath, this.remotePath).replace(/\\/g, '/'); // 远程的pathRegex
    if (this._check() === false) {
      return;
    }
    if (this.direction) {
      this.fromPath = this.fullLocalPath;
      this.destPath = this.fullRemotePath;
      this.fromLocaleMap = this.localLocaleMap;
      this.destLocaleMap = this.remoteLocaleMap;
      if (this.$options.localHooks) {
        const hooks = this.$options.localHooks;
        this.beforeLoad = hooks.beforeLoad;
        this.loaded = hooks.loaded;
        this.beforeRead = hooks.beforeRead;
        this.readed = hooks.readed;
        this.beforeConvert = hooks.beforeConvert;
        this.converted = hooks.converted;
      }
    } else {
      this.fromPath = this.fullRemotePath;
      this.destPath = this.fullLocalPath;
      this.fromLocaleMap = this.remoteLocaleMap;
      this.destLocaleMap = this.localLocaleMap;
      if (this.$options.remoteHooks) {
        const hooks = this.$options.remoteHooks;
        this.beforeLoad = hooks.beforeLoad;
        this.loaded = hooks.loaded;
        this.beforeRead = hooks.beforeRead;
        this.readed = hooks.readed;
        this.beforeConvert = hooks.beforeConvert;
        this.converted = hooks.converted;
      }
    }
    this.list = await this._load();
    await this._read();
    await this._convert();
    if (config.fillTranstion) {
      await this._complete();
    }
    await this._write();
  }

  _check() {
    const localKeys = [];
    const remoteKeys = [];
    try {
      ptr.pathToRegexp(this.localPath, localKeys);
    } catch (e) {
      console.log(this.localPath)
      throw e
    }
    try {
      ptr.pathToRegexp(this.remotePath, remoteKeys);
    } catch (e) {
      console.log(this.remotePath)
      throw e
    }
    if (localKeys.findIndex((it) => it.name === 'locale') < 0) {
      console.warn(this.name, 'warn: 缺少必要的参数 locale - ' + this.localPath);
      console.log(this.name, `${this.localPath} -> ${this.remotePath}`);
      return false;
    }
    if (localKeys.findIndex((it) => it.name === 'locale') < 0) {
      console.warn(this.name, 'warn: 缺少必要的参数 locale - ' + this.remotePath);
      return false;
    }
    if (localKeys.length !== remoteKeys.length) {
      console.warn(this.name, 'warn: 两边参数不相等，转换已跳过');
      console.log(this.name, `${this.localPath} -> ${this.remotePath}`);
      return false;
    }
    for (let i = 0; i < localKeys.length; i++) {
      const index = remoteKeys.findIndex((it) => it.name === localKeys[i].name);
      if (index < 0) {
        console.warn(this.name, 'warn: 两边参数不相同，转换已跳过');
        console.log(this.name, `${this.localPath} -> ${this.remotePath}`);
        return false;
      }
    }
  }

  async _load() {
    const { fromPath, destPath, fromLocaleMap } = this;
    if (this.beforeLoad) {
      this.beforeLoad(this);
    }
    const config = this.config;
    const basePath = ptr.getBasePath(fromPath);
    if (!fs.existsSync(basePath)) {
      console.warn(this.name, `warn: ${basePath} 路径不存在`);
      return;
    }
    const map = new Map();
    const temp = new Map();
    let flag = false;
    await walk(basePath, (fromFile) => {
      const matchFn = ptr.match(fromPath);
      const result = matchFn(fromFile.replace(/\\/g, '/'));
      if (!result) return;
      let locale = result.params.locale || '';
      locale = locale in fromLocaleMap ? fromLocaleMap[locale] : locale;
      result.params.locale = locale === '' ? undefined : locale;
      if (config.excludeLocales.has(locale)) {
        return;
      }
      if (config.locales.size > 0 && !config.locales.has(locale)) {
        return;
      }
      const toPathFn = ptr.compile(destPath);
      let toFile
      try {
        toFile = Path.normalize(toPathFn(result.params));
      } catch (e) {
        console.error(fromFile)
        console.error(result)
        throw e
      }
      if (map.has(fromFile)) {
        console.warn(this.name, `warn: 存在重复的映射关系，转换已跳过`);
        console.warn(this.name, `warn: ${fromFile} -> ${toFile}`);
        console.warn(this.name, `warn: ${fromFile} -> ${map.get(fromFile).path}`);
        map.clear();
        flag = true;
        return false;
      } else {
        map.set(fromFile, toFile);
      }
      if (temp.has(toFile)) {
        console.warn(this.name, 'warn: 存在重复的映射关系，转换已跳过');
        console.warn(this.name, `warn: ${fromFile} -> ${toFile}`);
        console.warn(this.name, `warn: ${temp.get(toFile)} -> ${toFile}`);
        temp.clear();
        flag = true;
        return false;
      } else {
        temp.set(toFile, fromFile);
      }
    });
    if (flag && map.size === 0) {
      console.warn(this.name, `warn: 没有获取到需要转换的文件, 请检查文件路径：${this.name} - ${basePath}`);
      return;
    }
    const list = [];
    map.forEach((toFile, fromFile) => {
      const file = this.direction ? toFile : fromFile;
      const match = ptr.match(this.fullRemotePath);
      const result = match(file.replace(/\\/g, '/'));
      list.push({
        from: fromFile,
        dest: toFile,
        locale: result.params.locale,
        fromType: this.getFromType(fromFile),
        destType: this.getDestType(toFile)
      });
    });
    if (this.loaded) {
      return this.loaded(this);
    }
    return list;
  }

  async _read() {
    const list = this.list;
    return Promise.all(
      list.map(async (item) => {
        if (this.beforeRead) {
          this.beforeRead(item, this);
        }
        const { from, fromType } = item;
        const text = await fsp.readFile(from, { encoding: 'utf-8' });
        item.text = text;
        try {
          item.obj = parse(text, fromType);
        } catch (e) {
          console.log({
            form: item.from,
            dest: item.dest,
            locale: item.locale
          });
          throw e;
        }
        if (this.readed) {
          item.obj = this.readed(item, this);
        }
      })
    );
  }

  async _convert() {
    if (this.direction) {
      await convertToRemote(this);
    } else {
      await convertToLocal(this);
    }
  }

  async _complete() {
    const list = this.list;
    return Promise.all(
      list.map(async (item) => {
        const { dest } = item;
        const templatePath = this.getLocalFile(dest, 'templates');
        let templateObj;
        if (dest === templatePath) return item;
        const index = list.findIndex((it) => it.dest === templatePath);
        if (index > -1) {
          templateObj = list[index].obj;
        } else {
          if (fs.existsSync(templatePath)) {
            const filetype = this.getLocalType(templatePath);
            templateObj = parse(await fsp.readFile(templatePath, { encoding: 'utf-8' }), filetype);
          } else {
            console.warn(this.name, '没有找到对应的中文文件，补全翻译将跳过');
            return item;
          }
        }
        item.obj = mergeWith(cloneDeep(templateObj), item.obj, this.fillTranstionFn);
        return item;
      })
    );
  }

  async _write() {
    const list = this.list;
    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      const obj = item.obj;
      const destPath = item.dest;
      const type = item.destType;
      const text = stringify(obj, type);
      item.text = text;
      if (!fs.existsSync(destPath)) {
        const dirname = Path.dirname(destPath);
        if (!fs.existsSync(dirname)) {
          await fsp.mkdir(dirname, { recursive: true });
        }
        await fsp.writeFile(destPath, text);
        // console.log(this.name, destPath);
      } else {
        const originalText = await fsp.readFile(destPath, { encoding: 'utf-8' });
        if (originalText !== text) {
          await fsp.writeFile(destPath, text);
          // console.log(this.name, destPath);
        }
      }
      if (!this.direction) {
        await this._copyToOther(item);
      }
    }
  }

  async _copyToOther(item) {
    const copyToOther = this.$options.copyToOther;
    if (copyToOther) {
      const destPath = item.dest;
      const text = item.text;
      const otherDest = Path.join(copyToOther, Path.basename(destPath));
      if (!fs.existsSync(otherDest)) {
        if (!fs.existsSync(copyToOther)) {
          await fsp.mkdir(copyToOther, { recursive: true });
        }
        await fsp.writeFile(otherDest, text);
        // console.log(this.name, otherDest);
      } else {
        const originalText = await fsp.readFile(otherDest, { encoding: 'utf-8' });
        if (originalText !== text) {
          await fsp.writeFile(otherDest, text);
          // console.log(this.name, otherDest);
        }
      }
    }
  }

  getDesc(path) {
    const obj = Path.parse(path);
    const info = {
      filename: obj.base,
      basename: obj.base,
      ext: obj.ext,
      root: obj.root,
      dirpath: obj.dir,
      dirname: Path.basename(obj.dir)
    };
    if (typeof this.desc === 'function') {
      return this.desc(info, this);
    } else {
      const compiled = template(this.desc, obj, {
        interpolate: /\{([\s\S]+?)\}/g
        // evaluate: null,
        // escape: null
      });
      return compiled(info);
    }
  }

  getTemplatePath(path, locale = 'templates') {
    const match = ptr.match(this.fullLocalPath);
    const toPath = ptr.compile(this.fullLocalPath);
    const result = match(path.replace(/\\/g, '/'));
    result.params.locale = locale in this.remoteLocaleMap ? this.remoteLocaleMap[locale] : locale;
    if (result.params.locale === '') {
      result.params.locale = undefined;
    }
    return toPath(result.params).replace(/\//g, '\\');
  }

  _getLocalType(path) {
    if (this.filetype) {
      return this.filetype;
    } else {
      const ext = Path.extname(path);
      return ext ? ext.slice(1).toLowerCase() : ext;
    }
  }

  _getRemoteType(path) {
    const ext = Path.extname(path);
    return ext ? ext.slice(1).toLowerCase() : ext;
  }

  getFromType(path) {
    if (this.direction) {
      return this._getLocalType(path);
    } else {
      return this._getRemoteType(path);
    }
  }

  getDestType(path) {
    if (this.direction) {
      return this._getRemoteType(path);
    } else {
      return this._getLocalType(path);
    }
  }

  async getFileList(pattern) {
    const fullPath = this.getBasedir(pattern);
    if (!fs.existsSync(fullPath)) {
      console.warn(`warn: ${this.name} - ${fullPath} 路径不存在`);
      return [];
    }
    const list = [];
    walk(fullPath, (file) => {
      const matchFn = ptr.match(pattern);
      const result = matchFn(file.replace(/\\/g, '/'));
      if (result) {
        list.push(file);
      }
    });
  }
}

module.exports.Task = Task;
