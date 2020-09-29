const Path = require('path');
const fs = require('fs');
const through = require('through2');
const { properties } = require('../utils/types');
const { parse } = require('../utils/parse');
const { stringify } = require('../utils/stringify');
const { deserial } = require('../utils/serial');
const merge = require('lodash/merge');
const last = require('lodash/last');

const convertRemote = function (config, localFiles, withMerge) {
  return through.obj(function (file, __, callback) {
    file.isRemote = true;
    if (file.isNull()) {
      return callback(null, file);
    }

    if (file.isStream()) {
      this.emit('error', new Error('Streams not supported!'));
    } else if (file.isBuffer()) {
      const contents = file.contents.toString();
      const localPath = config.getLocalPath(file.path);
      const type = config.type || (last(Path.extname(file.path).split('.')) || '').toLowerCase()
      try {
        let text;
        let src;
        const defaultText = fs.readFileSync(config.getTemplatePath(file.path), { encoding: 'utf-8' })
        const defaultSrc = parse(type, defaultText)
        if (fs.existsSync(localPath)) {
          text = fs.readFileSync(localPath, { encoding: 'utf-8' });
          localFiles[Path.resolve(localPath)] = text
          src = parse(type, text)
        }
        let str;
        let obj;
        if (type === properties) {
          obj = parse(type, contents);
        } else {
          obj = JSON.parse(contents);
          Object.keys(obj).forEach((key) => {
            // 远程翻译文件的值，好像也不能是number，这里暂且这样处理
            if (typeof obj[key].message !== 'string' && typeof obj[key].message !== 'number') {
              console.warn(`warn: ${file.path} 的 ${key} 字段的 message 属性的值不是字符串或数字`)
              return
            }
            if (typeof obj[key].description !== 'string' && typeof obj[key].description !== 'number') {
              console.warn(`warn: ${file.path} 的 ${key} 字段的 description 属性的值不是字符串或数字`)
            }
            // 假如现在需要重构一个插值，那么整个文本是需要重新翻译的，可以在老师翻译完毕之前，将旧的值放在oldValue字段上。如果直接同步message的值，可能会导致丢失插值。删除翻译，回退到中文，又会导致页面出现中文。
            if (obj[key].useOldValue && (typeof obj[key].oldValue === 'string' || typeof obj[key].oldValue === 'number')) {
              obj[key] = obj[key].oldValue
            } else {
              obj[key] = obj[key].message;
            }
          });
        }
        if (config.remoteParseAfter) {
          obj = config.remoteParseAfter(file, obj, src, defaultSrc, config);
        }
        if (type !== properties) {
          obj = deserial(obj, config.mergeLocal ? defaultSrc : undefined);
        }
        if (config.remoteDeserialAfter) {
          obj = config.remoteDeserialAfter(file, obj, src, defaultSrc, config);
        }
        if (config.mergeLocal) {
          obj = merge(merge(obj, src), obj);
        }
        str = stringify(type, obj, contents, { unicode: true, filepath: localPath });
        file.contents = Buffer.from(str);
        if (!withMerge && (text === undefined || text !== str)) {
          console.log(Path.relative('', localPath));
        }
        file.path = Path.resolve(localPath);
      } catch (error) {
        console.error('remote: ' + file.path);
        console.error('local: ' + localPath);
        return callback(error, file);
      }
      return callback(null, file);
    }
  });
};

module.exports = convertRemote;
