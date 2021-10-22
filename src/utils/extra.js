const Path = require('path');
const fs = require('fs');
const merge = require('lodash/merge');
const fsp = fs.promises;

const hasChinese = (str) => {
  return /[\u4e00-\u9fa5]/.test(str);
};

const travel = async (path, callback) => {
  const files = await fsp.readdir(path);
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const fullPath = Path.join(path, file);
    const stats = await fsp.stat(fullPath);
    if (stats.isFile() || stats.isSymbolicLink()) {
      const status = callback(fullPath);
      if (status === false) break;
    } else if (stats.isDirectory()) {
      const name = Path.basename(path);
      if (name.startsWith('.')) return;
      const status = await travel(fullPath, callback);
      if (status === false) break;
    }
  }
};

const walk = async (path, callback = () => {}) => {
  const stats = await fsp.stat(path);
  if (stats.isDirectory()) {
    const name = Path.basename(path);
    if (name.startsWith('.')) return;
    await travel(path, callback);
  } else if (stats.isFile() || stats.isSymbolicLink()) {
    return callback(path);
  }
};

const pickBySource = (obj, src) => {
  const callback = (accu, value, key) => {
    if (src[key] === undefined) return accu;
    if (typeof value === 'object' && value !== null && typeof src[key] === 'object' && src[key] !== null) {
      const object = pickBySource(value, src[key]);
      if (Object.keys(object).length > 0) {
        accu[key] = object;
      }
    } else {
      accu[key] = value;
    }
    return accu;
  };
  if (typeof src !== 'object' || src === null) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.reduce(callback, []);
  } else {
    return Object.keys(obj).reduce((accu, key) => {
      return callback(accu, obj[key], key);
    }, {});
  }
};

const setByKeys = (obj, keys, value) => {
  if (keys.length === 0) return false;
  if (typeof obj !== 'object' || obj === null) return false;
  let val = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (typeof val[key] === 'object' && val[key] !== null) {
      val = val[key];
    } else {
      return false;
    }
  }
  val[keys[keys.length - 1]] = value;
  return true;
};

const pickByKeys = (obj, keys) => {
  return keys.reduce((accu, arr) => {
    let val = obj;
    let i;
    for (i = 0; i < arr.length; i++) {
      const key = arr[i];
      if (typeof val !== 'object' || val === null) {
        break;
      }
      val = val[key]
    }
    if (i >= arr.length && val !== undefined) {
      let a = accu;
      let o = obj;
      for (let i = 0; i < arr.length - 1; i++) {
        const key = arr[i];
        o = o[key];
        if (a[key] !== undefined) {
          return accu;
        }
        if (Array.isArray(o)) {
          a = a[key] = []
        } else {
          a = a[key] = {}
        }
      }
      a[arr[arr.length - 1]] = val
    }
    return accu;
  }, Array.isArray(obj) ? [] : {})
}

const mergeLeft = (object, source) => {
  if (object === source) return object;
  const newSource = pickBySource(source, object)
  return merge({}, object, newSource)
}

module.exports.hasChinese = hasChinese;
module.exports.walk = walk;
module.exports.pickBySource = pickBySource;
module.exports.setBykeys = setByKeys;
module.exports.pickByKeys = pickByKeys;
module.exports.mergeLeft = mergeLeft
