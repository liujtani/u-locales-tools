const Path = require('path');
const through = require('through2');
const last = require('lodash/last')
const fs = require('fs');
const { properties } = require('../utils/types');
const { stringify } = require('../utils/properties');
const { parse } = require('../utils/parse');
const { serial } = require('../utils/serial');
const { transToRemoteFormat } = require('./remoteFormat');

module.exports = function (config) {
  return through.obj(function (file, _, callback) {
    const remotePath = config.getRemotePath(file.path);
    const locale = config.getLocaleByRemote(remotePath)
    if (file.isNull()) {
      return callback(null, file);
    }
    if (file.isStream()) {
      this.emit('error', new Error('Streams not supported!'));
    } else if (file.isBuffer()) {
      const contents = file.contents.toString();
      const type = config.type || (last(Path.extname(file.path).split('.')) || '').toLowerCase()
      try {
        let obj;
        let str;
        obj = parse(type, contents);
        if (config.localParseAfter) {
          obj = config.localParseAfter(file, obj, config);
        }
        if (type !== properties) {
          obj = serial(obj, !config.mergeLocal);
        }
        let remoteObj = null;
        let remoteText;
        if (fs.existsSync(remotePath)) {
          remoteText = fs.readFileSync(remotePath, { encoding: 'utf-8' });
          if (type === properties) {
            remoteObj = parse(properties, remoteText)
          } else {
            remoteObj = JSON.parse(remoteText);
          }
        }
        if (type === properties) {
          str = stringify(obj, contents, { unicode: false });
        } else {
          str = JSON.stringify(transToRemoteFormat({ src: obj, ref: remoteObj, locale, config, path: file.path }), null, 2) + '\n';
        }
        file.contents = Buffer.from(str);
        if (remoteText !== str) {
          console.log(Path.relative('', remotePath));
        }
        file.path = Path.resolve(remotePath);
      } catch (error) {
        console.error('local: ' + file.path);
        console.error('remote: ' + remotePath);
        return callback(error, file);
      }
      return callback(null, file);
    }
  });
};
