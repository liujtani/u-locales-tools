const Path = require('path');
const fs = require('fs');
const fsp = fs.promises;
const template = require('lodash/template');
const merge = require('lodash/merge');
const invert = require('lodash/invert');
const isNil = require('lodash/isNil');
const { serial, deserial } = require('../utils/serial');
const { parse, stringify, properties } = require('../parse-tool');

const { walk, mergeLeft, hasChinese, setBykeys, pickBySource, pickByKeys } = require('../utils/extra');
const ptr = require('../utils/ptr');
const { write, hasLocale } = require('./util');
const log = require('../utils/log');
const chalk = require('chalk');
const { cloneDeep } = require('lodash');

class Task {
  constructor(group, project, config) {
    if (new.target === Task) {
      throw new Error('');
    }
    const defaultLocaleMap = {
      templates: 'zh',
      'zh-TW': 'tw'
    };

    this.config = config;

    this.project = project.name;
    this.srcBasePath = project.basePath;

    this.name = group.name;
    this.src = group.src.replace(/\\/g, '/');
    const pattern = group.src.match(/:locale(\([\s\S]*\))?\?/) ? ':locale?' : ':locale';
    this.dstBasePath = config.repo;
    this.dst = Path.join(pattern, group.dst).replace(/\\/g, '/');
    this.dstLocaleMap = Object.assign(defaultLocaleMap, group.localeMap);
    this.srcLocaleMap = invert(this.dstLocaleMap);
    this.srcType = group.srcType;
    this.dstType = group.dstType;
    this.omitKeys = group.omitKeys || [];
    if (this.omitKeys.length > 0) {
      if (!this.omitKeys.every((it) => Array.isArray(it))) {
        console.log(chalk.yellow(`omitKeys: omitKeys不是一个二元数组 - ${this.omitKeys}`));
        this.omitKeys = [];
      }
    }
    this.fillTranslation = group.fillTranslation !== false; // 是否支持使用中文补全翻译，默认补全，大多数项目都需要补全翻译，但也有的项目不需要，例如course-web项目

    const hooks = group.hooks || {};

    this.beforeLoad = hooks.beforeLoad;
    this.loaded = hooks.loaded;
    this.beforeRead = hooks.beforeRead;
    this.readed = hooks.readed;
    this.converted = hooks.converted;
    this.written = hooks.written;

    this.srcToDst = true;
  }

  check() {
    const srcKeys = [];
    const dstKeys = [];
    try {
      ptr.pathToRegexp(this.src, srcKeys);
    } catch (e) {
      log.error(`src: ${this.src} - ${e.message}`);
      throw e;
    }
    try {
      ptr.pathToRegexp(this.dst, dstKeys);
    } catch (e) {
      log.error(`dst: ${this.dst} - ${e.message}`);
      throw e;
    }
    if (srcKeys.findIndex((it) => it.name === 'locale') < 0) {
      log.error(`src: ${this.src} 中缺少 locale 参数`);
      process.exit(1);
    }
    if (dstKeys.findIndex((it) => it.name === 'locale') < 0) {
      log.error(`dst: ${this.dst} 中缺少 locale 参数`);
      process.exit(1);
    }
    if (srcKeys.length !== dstKeys.length) {
      log.error(`${this.src} 和 ${this.dst} 的参数数量不相等：${srcKeys} - ${dstKeys}`);
      process.exit(1);
    }
    for (let i = 0; i < srcKeys.length; i++) {
      const index = dstKeys.findIndex((it) => it.name === srcKeys[i].name);
      if (index < 0) {
        log.error(`${this.src} 和 ${this.dst} 的参数数量不相同：${srcKeys} - ${dstKeys}`);
        process.exit(1);
      }
    }
    // check basePath
    const { src } = this;
    const basePath = Path.join(this.srcBasePath, ptr.getBasePath(src));
    if (!fs.existsSync(basePath)) {
      log.error(`${this.project}${this.name ? ':' + this.name : ''} ${basePath} 路径不存在`);
      process.exit(1);
    }
    this.srcPrefixPath = basePath;
    this._checked = true;
  }

  async start() {
    if (!this._checked) {
      this.check();
    }
    this.beforeLoad && this.beforeLoad(this);
    this.list = await this.load();
    this.loaded && this.loaded(this);
    if (this.config.list) {
      log.list(this.list.filter((it) => !it.hidden));
      return 0;
    }

    await Promise.all(
      this.list.map(async (item) => {
        this.beforeLoad && this.beforeRead(item, this);
        await this.read(item, this);
        this.readed && this.readed(item, this);
      })
    );
    await Promise.all(
      this.list.map(async (item) => {
        await this.convert(item, this);
        this.converted && this.converted(item, this);
      })
    );
  }

  async load() {
    const { src, dst, srcLocaleMap } = this;
    const config = this.config;
    const basePath = this.srcPrefixPath;
    const list = [];
    await walk(basePath, (srcFile) => {
      const matchFn = ptr.match(src);
      const result = matchFn(srcFile.replace(/\\/g, '/'));
      if (!result) return;
      const srcLocale = result.params.locale || '';
      const dstLocale = Object.prototype.hasOwnProperty.call(srcLocaleMap, srcLocale) ? srcLocaleMap[srcLocale] : srcLocale;
      result.params.locale = dstLocale === '' ? undefined : dstLocale;
      const locale = this.srcToDst ? dstLocale : srcLocale;
      let hidden = locale === 'templates';
      if (hidden || hasLocale(locale, config)) {
        hidden = hidden && !hasLocale(locale, config);
        const toPathFn = ptr.compile(dst);
        const dstFile = Path.normalize(toPathFn(result.params));
        list.push({
          src: srcFile,
          dst: Path.join(this.dstBasePath, dstFile),
          srcType: this.getType(this.srcType, srcFile),
          dstType: this.getType(this.dstType, dstFile),
          locale,
          hidden: hidden
        });
      }
    });
    list.sort((a, b) => {
      if (a.locale === 'templates' && b.locale === 'templates') return 0;
      if (a.locale === 'templates') return -1;
      if (b.locale === 'templates') return 1;
      return 0;
    });
    return list;
  }

  async read(item) {
    const { src, srcType, dst, dstType } = item;
    item.srcText = await fsp.readFile(src, { encoding: 'utf-8' });
    item.srcObj = parse(item.srcText, { type: srcType, path: src });
    if (fs.existsSync(dst)) {
      item.dstText = await fsp.readFile(dst, { encoding: 'utf-8' });
      item.dstObj = parse(item.dstText, { type: dstType, path: dst });
    }
  }

  async convert() {}

  async write() {
    let count = 0;
    for (let i = 0; i < this.list.length; i++) {
      const item = this.list[i];
      if (!item.hidden) {
        if (!fs.existsSync(item.dst) && Object.keys(item.dstObj).length === 0) {
          continue;
        }
        const text = stringify(item.dstObj, { path: item.dst, unicode: !this.srcToDst, type: item.dstType });
        const status = await write(item.dst, text);
        status && (count += 1);
        this.written && this.written(item, this);
      }
    }
    return count;
  }

  getType(type, path) {
    if (typeof type === 'string') {
      return type;
    }
    const filetype = Path.extname(path).slice(1);
    if (typeof type === 'object' && type !== null) {
      return type[filetype] || filetype;
    }
    return filetype;
  }

  getSrcByLocale(path, locale = 'templates') {
    const newLocale = this.srcToDst ? (Object.prototype.hasOwnProperty.call(this.dstLocaleMap, locale) ? this.dstLocaleMap[locale] : locale) : locale;
    return Path.join(this.srcBasePath, this._getPathByLocale(path, this.src, newLocale));
  }

  getDstByLocale(path, locale = 'templates') {
    const newLocale = !this.srcToDst ? (Object.prototype.hasOwnProperty.call(this.srcLocaleMap, locale) ? this.srcLocaleMap[locale] : locale) : locale;
    return Path.join(this.dstBasePath, this._getPathByLocale(path, this.dst, newLocale));
  }

  getSrcObj(path, locale) {
    const newPath = this.getSrcByLocale(path, locale);
    const index = this.list.findIndex((it) => it.src === newPath);
    return index > -1 ? this.list[index].srcObj : null;
  }

  getDstObj(path, locale) {
    const newPath = this.getDstByLocale(path, locale);
    const index = this.list.findIndex((it) => it.dst === newPath);
    return index > -1 ? this.list[index].dstObj : null;
  }

  _getPathByLocale(path, pattern, locale) {
    path = path.replace(/\\/g, '/');
    const match = ptr.match(pattern);
    const result = match(path);
    result.params.locale = locale || undefined;
    const toPath = ptr.compile(pattern);
    return Path.normalize(toPath(result.params));
  }
}

class StoreTask extends Task {
  constructor(group, project, config) {
    group.hooks = group.srcHooks;
    super(group, project, config);
    // this.mergeLocal = group.mergeLocal || false; // 是否需要参考本地文件的格式生成文件
    this.desc = group.desc;
  }

  async convert(item) {
    const { src, srcType, locale, hidden } = item;
    if (hidden) return;
    let { srcObj, dstObj = {} } = item;
    const srcTemplateObj = this.getSrcObj(src);
    item.srcTemplateObj = srcTemplateObj;
    if (srcTemplateObj) {
      srcObj = mergeLeft(srcTemplateObj, srcObj);
    }

    this.omitKeys.forEach((keys) => {
      setBykeys(srcObj, keys, undefined);
    });

    if (srcType !== properties) {
      srcObj = serial(srcObj);
    }

    const filled = this.config.fill && this.fillTranslation && locale !== 'templates' && locale !== 'zh-TW';

    const containChinese = (message) => {
      return filled && hasChinese(message);
    };

    const convert = (accu, key, message, description) => {
      if (isNil(message)) return accu;
      if (!containChinese(message)) {
        accu[key] = dstObj[key] || {};
        if (accu[key].message !== undefined && accu[key].message !== message) {
          console.warn(chalk.yellow(`warn: ${this.project}#${key} - 不要仅修改key对应的字串，key本身也需要修改`));
        }
        accu[key].message = message;
        if (description && accu[key].description === undefined) {
          accu[key].description = description;
        }
      }
      return accu;
    };

    let dstObject;
    if (srcType === properties) {
      dstObject = Object.keys(srcObj).reduce((accu, key) => {
        return convert(accu, key, srcObj[key].message, srcObj[key].description);
      }, {});
    } else {
      const desc = this.getDesc(src);
      dstObject = Object.keys(srcObj).reduce((accu, key) => {
        return convert(accu, key, srcObj[key], desc);
      }, {});
    }

    item.dstObj = merge(dstObj, dstObject);
    // if (!this.config.override) {
    //   item.dstObj = Object.assign(dstObj, item.dstObj)
    // }
  }

  getDesc(src) {
    if (typeof this.desc === 'function') {
      return this.desc(src, this) || '';
    } else {
      if (!this.desc) return '';
      const obj = Path.parse(src);
      const info = {
        filename: obj.base,
        basename: obj.name,
        ext: obj.ext,
        root: obj.root,
        dirpath: obj.dir,
        dirname: Path.basename(obj.dir)
      };
      const compiled = template(this.desc, {
        interpolate: /\{([\s\S]+?)\}/g
        // evaluate: null,
        // escape: null
      });
      return compiled(info);
    }
  }
}
class ApplyTask extends Task {
  constructor(group, project, config) {
    group.hooks = group.dstHooks;
    super(group, project, config);
    this.direction = false;
    [this.srcType, this.dstType] = [this.dstType, this.srcType];
    [this.src, this.dst] = [this.dst, this.src];
    [this.srcBasePath, this.dstBasePath] = [this.dstBasePath, this.srcBasePath];
    [this.srcLocaleMap, this.dstLocaleMap] = [this.dstLocaleMap, this.srcLocaleMap];

    if (group.dst2 !== undefined && group.dst2 !== null) {
      let dst2;
      if (typeof group.dst2 === 'function') {
        dst2 = group.dst2(config);
      } else {
        dst2 = group.dst2;
      }
      dst2 = Array.isArray(dst2) ? dst2 : [dst2];

      if (!dst2.every((it) => typeof it === 'string')) {
        log.error(`dst2: ${dst2}`);
        process.exit(1);
      }

      if (typeof group.dst2 !== 'function') {
        dst2 = dst2.map((it) => Path.posix.join(this.dstBasePath, it));
      }

      this.dst2 = dst2;
    }

    this.srcToDst = false;
  }

  async convert(item) {
    const { srcType, dst, locale, dstType, hidden } = item;
    let { dstObj, srcObj } = item;
    let dstTemplateObj = this.getDstObj(dst);
    item.dstTemplateObj = dstTemplateObj;

    if (srcType === properties) {
      srcObj = Object.keys(srcObj).reduce((accu, key) => {
        accu[key] = { message: srcObj[key].message };
        accu[key].message = accu[key].message || '';
        return accu;
      }, {});
    } else {
      srcObj = Object.keys(srcObj).reduce((accu, key) => {
        const value = srcObj[key];
        accu[key] = (value && value.message) || '';
        return accu;
      }, {});
    }

    if (dstType !== properties) {
      srcObj = deserial(srcObj, dstTemplateObj || dstObj || {});
    }

    if (locale === 'templates') {
      if (hidden || !dstObj) {
        item.dstObj = srcObj
        return
      }
      if (this.config.append) {
        srcObj = merge(dstObj, srcObj);
      } else {
        srcObj = mergeLeft(dstObj, srcObj);
      }
      item.dstObj = srcObj
      return;
    }

    if (dstObj) {
      srcObj = merge(dstObj, srcObj);
    }
    if (dstTemplateObj) {
      if (this.omitKeys.length > 0) {
        dstTemplateObj = cloneDeep(dstTemplateObj)
        setBykeys(dstTemplateObj, this.omitKeys, undefined)
        const omitObj = pickByKeys(dstObj, this.omitKeys)
        dstTemplateObj = merge(dstTemplateObj, omitObj)
      }

      if (this.fillTranslation && this.config.fill) {
        srcObj = mergeLeft(dstTemplateObj, srcObj)
      } else {
        srcObj = pickBySource(srcObj, dstTemplateObj)
      }
    }

    item.dstObj = srcObj;
  }

  async write() {
    const count = await super.write();
    if (this.dst2 && this.dst2.length) {
      await this.copyToDst2();
    }
    return count;
  }

  async copyToDst2() {
    const dst2 = this.dst2;
    for (let i = 0; i < this.list.length; i++) {
      const item = this.list[i];
      const { dst } = item;
      for (let j = 0; j < dst2.length; j++) {
        const dstDir = dst2[j];
        if (fs.existsSync(dstDir)) {
          if (!fs.existsSync(dstDir)) {
            await fsp.mkdir(dstDir, { recursive: true });
          }
          await fsp.copyFile(dst, Path.join(dstDir, Path.basename(dst)));
        }
      }
    }
  }
}

module.exports.Task = Task;
module.exports.StoreTask = StoreTask;
module.exports.ApplyTask = ApplyTask;
