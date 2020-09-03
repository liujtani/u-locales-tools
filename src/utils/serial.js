const forEach = require('lodash/forEach');
const set = require('lodash/set');
const every = require('lodash/every');

const serial = (obj, checkDot = true) => {
  if (!((typeof obj === 'object' && obj !== null) || Array.isArray(obj))) return obj;
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
        if (checkDot) {
          if (/[.[\]]/.test(key)) {
            console.error(key);
            throw new Error('键值中不能包含字符 .[]，请修正字符');
          }
        }
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

const composite = (array) => {
  let result = [];
  for (let i = 0; i < array.length; i++) {
    if (result.length === 0) {
      result.push([array[i]]);
    } else {
      const subs = [];
      for (let j = 0; j < result.length; j++) {
        const sub = result[j];
        const last = sub[sub.length - 1];
        if (Array.isArray(last)) {
          subs.push([...sub, array[i]]);
          subs.push([...sub.slice(0, sub.length - 1), [...last, array[i]]]);
        } else {
          subs.push([...sub, array[i]]);
          subs.push([...sub.slice(0, sub.length - 1), [last, array[i]]]);
        }
      }
      result = [];
      result.push(...subs);
    }
  }
  return result.reverse();
};

const get = (obj, array) => {
  let value = obj;
  for (let i = 0; i < array.length; i++) {
    const key = array[i];
    value = value[key];
    if (i === array.length - 1) {
      return value;
    } else {
      if (typeof value !== 'object' || value === null) {
        return undefined;
      }
    }
  }
};

const deserial = (obj, src) => {
  if (!((typeof obj === 'object' && obj !== null) || Array.isArray(obj))) return obj;
  let result = {};
  if (Array.isArray(src)) {
    result = [];
  } else if (Object.keys(obj).length > 0 && every(obj, (_, key) => /^\{\d+\}$/.test(key))) {
    result = [];
  }
  if (typeof src === 'object' && src !== null) {
    forEach(obj, function (value, key) {
      let seps = key.split(/\.|(?=\[)|(?<=\])/);
      seps = seps.map((sep) => {
        if (sep[0] === '[' && sep[sep.length - 1] === ']') {
          return /^(0|[1-9]\d*)$/.test(sep.slice(1, sep.length - 1)) ? Number(sep.slice(1, sep.length - 1)) : sep;
        } else {
          return sep;
        }
      });
      const permuate = composite(seps);
      const compositeSeps = permuate.map((arr) => {
        return arr.map((it) => {
          if (Array.isArray(it)) {
            if (it.length > 1) {
              return it.reduce((accu, curr, index) => {
                if (typeof curr === 'number') {
                  accu += `[${curr}]`;
                } else {
                  accu += index === 0 ? curr : `.${curr}`;
                }
                return accu;
              }, '');
            } else {
              return it[0];
            }
          }
          return it;
        });
      });
      const sep = compositeSeps.find((it) => {
        return get(src, it) !== undefined;
      });
      if (sep) {
        let o = result;
        sep.forEach((key, index) => {
          if (index < sep.length - 1) {
            o = o[key] = o[key] || (typeof sep[index + 1] === 'number' ? [] : {});
          } else {
            o = o[key] = value;
          }
        });
      } else {
        set(result, key, value);
      }
    });
  } else {
    forEach(obj, function (value, key) {
      set(result, key, value);
    });
  }
  return result;
};

module.exports.serial = serial;
module.exports.deserial = deserial;
