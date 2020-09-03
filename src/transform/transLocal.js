const Path = require('path');
const through = require('through2');
const forEach = require('lodash/forEach');
const fs = require('fs');
const { properties } = require('../utils/types');
const { stringify } = require('../utils/properties');
const { parse } = require('../utils/parse');
const { serial } = require('../utils/serial');

module.exports = function (config) {
  return through.obj(function (file, _, callback) {
    const remotePath = config.getRemotePath(file.path);
    if (file.isNull()) {
      return callback(null, file);
    }
    if (file.isStream()) {
      this.emit('error', new Error('Streams not supported!'));
    } else if (file.isBuffer()) {
      const contents = file.contents.toString();
      try {
        let obj;
        let str;
        obj = parse(config.type, contents);
        if (config.localParseAfter) {
          obj = config.localParseAfter(file, obj, config);
        }
        if (config.type !== properties) {
          obj = serial(obj, !config.mergeLocal);
        }
        let remoteObj = null;
        let remoteText;
        if (fs.existsSync(remotePath)) {
          remoteText = fs.readFileSync(remotePath, { encoding: 'utf-8' });
          if (config.type === properties) {
            remoteObj = parse(properties, remoteText)
          } else {
            remoteObj = JSON.parse(remoteText);
          }
        }
        if (config.type === properties) {
          str = stringify(obj, contents, { unicode: false });
        } else {
          forEach(obj, function (value, key) {
            if (value !== undefined) {
              obj[key] = {
                message: value,
                description: remoteObj && remoteObj[key] && remoteObj[key].description ? remoteObj[key].description : config.getDesc(file.path)
              };
            }
          });
          str = JSON.stringify(obj, null, 2) + '\n';
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
