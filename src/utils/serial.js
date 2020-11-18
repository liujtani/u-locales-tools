const forEach = require('lodash/forEach');
const set = require('lodash/set');
const every = require('lodash/every');
const clone = require('lodash/clone');
const merge = require('lodash/merge');

const serial = (obj) => {
  if (!(typeof obj === 'object' && obj !== null)) return obj;
  const result = {};

  function travel(obj, serialKey = '') {
    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        const value = obj[i];
        travel(value, serialKey ? serialKey + '[' + i + ']' : `[${i}]`);
      }
    } else if (typeof obj === 'object' && obj !== null) {
      const keys = Object.keys(obj);
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const value = obj[key];
        // if (checkDot) {
        //   if (/[.[\]]/.test(key)) {
        //     console.error(key);
        //     throw new Error('键值中不能包含字符 .[]，请修正字符');
        //   }
        // }
        travel(value, serialKey ? serialKey + '.' + key : key);
      }
    } else {
      if (result[serialKey]) {
        console.error(serialKey);
        throw new Error('源文件中中的key组合起来后，包含相同的key，会覆盖先前的key，请修正后，再进行转换');
      }
      result[serialKey] = obj;
    }
  }
  travel(obj);
  return result;
};

const eachDeep = (obj, callback) => {
  if (typeof obj !== 'object' || obj === null) return;

  const travel = (obj, keys) => {
    const cb = (k) => {
      const value = obj[k];
      if (typeof value === 'object' && value !== null) {
        travel(value, [...keys, k]);
      } else {
        callback(value, [...keys, k], obj);
      }
    };
    if (Array.isArray(obj)) {
      obj.forEach((_, index) => {
        cb(index);
      });
    } else {
      Object.keys(obj).forEach(cb);
    }
  };
  travel(obj, []);
};

const setByKeys = (obj, keys, value) => {
  if (keys.length === 0) return;
  if (typeof obj !== 'object' || obj === null) return
  let val = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (typeof val[key] === 'object' && val[key] !== null) {
      val = val[key];
    } else {
      const nextKey = keys[i + 1];
      val = val[key] = typeof nextKey === 'number' ? [] : {};
    }
  }
  val[keys[keys.length - 1]] = value;
};

const deserial = (obj, src) => {
  if (!(typeof obj === 'object' && obj !== null)) return obj;
  if (typeof src === 'object' && src !== null) {
    const object = clone(obj);
    const result = Array.isArray(src) ? [] : {};
    eachDeep(src, (value, keys) => {
      const compositeKey = keys.reduce((accu, key, index) => {
        let sep = key;
        if (typeof key === 'number') {
          sep = `[${key}]`;
        } else if (index > 0) {
          sep = `.${key}`;
        }
        return accu + sep;
      }, '');
      if (object[compositeKey] !== undefined) {
        setByKeys(result, keys, object[compositeKey]);
        object[compositeKey] = undefined;
      }
    });
    merge(result, object)
    return result;
  } else {
    let result = {};
    if (Object.keys(obj).length > 0 && every(obj, (_, key) => /^\[(0|[1-9]\d*)\]$/.test(key))) {
      result = [];
    }
    forEach(obj, function (value, key) {
      set(result, key, value);
    });
    return result;
  }
};

module.exports.serial = serial;
module.exports.deserial = deserial;
