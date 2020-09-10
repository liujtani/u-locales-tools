const Path = require('path');
const escapeRegExp = require('lodash/escapeRegExp');
const isNil = require('lodash/isNil');
const { getGlobsBase } = require('../utils/extra');
const { rc } = require('../utils/rc');

const templates = 'templates';

const remoteBasepath = Path.posix.join(rc.remoteRepo, 'locales');

class Config {
  constructor(option) {
    const remoteFilename = option.remoteFilename || option.project;
    this.project = option.project;
    this.type = option.type;
    this.localGlob = option.localGlob;
    this.remoteGlob = option.remoteGlob || '**/' + remoteFilename;
    this.remoteGlob = Array.isArray(this.remoteGlob) ? this.remoteGlob.map((glob) => Path.posix.join(remoteBasepath, glob)) : Path.posix.join(remoteBasepath, this.remoteGlob);
    this.remoteLocaleMap = Object.assign(
      {
        templates: 'zh',
        'zh-TW': 'tw'
      },
      option.localeMap
    );
    this.localLocaleMap = Object.assign(
      Object.keys(this.remoteLocaleMap).reduce((obj, key) => ((obj[this.remoteLocaleMap[key]] = key), obj), {}),
      option.localLocaleMap
    );
    this.localTemplate = option.fileMap[0];
    this.remoteTemplate = option.fileMap[1] || '{locale}/' + remoteFilename;
    this.localRegex = this.compile(this.localTemplate);
    this.mregeRegex = this.compile(this.localTemplate);
    this.remoteRegexp = this.compile(this.remoteTemplate);
    if (Array.isArray(option.desc)) {
      this.descRegexp = this.compile(option.desc[0]);
      this.descTemplate = option.desc[1];
    } else {
      this.desc = option.desc || remoteFilename;
    }
    this.basePath = getGlobsBase(this.localGlob);
    this.dest = option.dest ? option.dest.replace(/\/+$/, '') : this.basePath;
    this.needMerge = option.needMerge !== false;
    this.mergeLocal = option.mergeLocal || false;
    this.otherDest = option.otherDest;
    this.mergeCallback = option.mergeCallback;
    this.localParseAfter = option.localParseAfter;
    this.localSerialAfter = option.localSerialAfter;
    this.remoteParseAfter = option.remoteParseAfter;
    this.remoteDeserialAfter = option.remoteDeserialAfter;
  }

  compile(pattern) {
    let flag = false;
    let regexp = pattern.replace(/([\s\S]*?)(\{.+?\})([\s\S]*?)/g, function (str, $1, $2, $3) {
      flag = true;
      const interpolation = $2.slice(1, $2.length - 1);
      const [key, reg = '[^/]+'] = interpolation.split(':');
      return escapeRegExp($1) + '(?<' + key.trim() + '>' + reg.trim() + ')' + escapeRegExp($3);
    });
    if (!flag) {
      regexp = escapeRegExp(regexp);
    }
    regexp += '$';
    regexp = new RegExp(regexp);
    return regexp;
  }

  replace(path, regexp, template, map) {
    const p = path.replace(/\\/g, '/');
    const result = regexp.exec(p);
    if (result === null) {
      console.error(path);
      console.error(regexp);
      throw new Error('没有匹配到指定的路径，请检查');
    }

    return template.replace(/\{.+?\}/g, function (str) {
      const key = str
        .slice(1, str.length - 1)
        .split(':')[0]
        .trim();
      const v = result.groups[key] || '';
      if (key === 'locale') {
        let newV = v;
        if (typeof map === 'object' && map !== null) {
          newV = !isNil(map[v]) ? map[v] : v;
        } else if (typeof map === 'function') {
          newV = map(v);
        }
        return newV;
      } else {
        return v;
      }
    });
  }

  getDesc(path) {
    return this.descRegexp ? this.replace(path, this.descRegexp, this.descTemplate, this.localLocaleMap) : this.desc;
  }

  getCommonPart(path, map) {
    return this.replace(path, this.localRegex, this.localTemplate, map);
  }

  getRemotePath(path) {
    const file = this.replace(path, this.localRegex, this.remoteTemplate, this.localLocaleMap);
    return Path.join(remoteBasepath, file);
  }

  getLocalPath(path) {
    const file = this.replace(path, this.remoteRegexp, this.localTemplate, this.remoteLocaleMap);
    return Path.join(this.dest, file);
  }

  getLocaleFilePath(path, namespace) {
    const seps = path.split(Path.sep);
    seps[seps.length - 2] = namespace;
    return this.getLocalPath(seps.join(Path.sep));
  }

  getTemplatePath(path) {
    return this.getLocaleFilePath(path, templates);
  }

  isLocalTemplate(path) {
    const p = path.replace(/\\/g, '/');
    const result = this.localRegex.exec(p);
    if (result && result.groups.locale) {
      return this.localLocaleMap[result.groups.locale] === templates;
    } else {
      return false;
    }
  }

  isRemoteTemplate(path) {
    const seps = path.split(Path.sep);
    return seps[seps.length - 2] === templates
  }
}

Config.remoteBasepath = remoteBasepath;

module.exports.remoteBasepath = remoteBasepath;
module.exports.Config = Config;
