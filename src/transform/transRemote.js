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
            if (obj[key].message === undefined || obj[key].description === undefined) {
              throw new Error('缺少必要的key：' + key);
            }
            obj[key] = obj[key].message;
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
        str = stringify(type, obj, contents, { unicode: true });
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
