const ptr = require('path-to-regexp');
const Path = require('path');

const defaultOptions = {
  sensitive: true,
  end: true,
  start: false,
  delimiter: '/'
};

module.exports.pathToRegexp = (path, keys, options) => ptr.pathToRegexp(path, keys, Object.assign({}, defaultOptions, options));
module.exports.parse = (path, options) => ptr.parse(path, Object.assign({}, defaultOptions, options));
module.exports.match = (path, options) => ptr.match(path, Object.assign({}, defaultOptions, options));
module.exports.compile = (path, options) => ptr.compile(path, Object.assign({}, defaultOptions, options));
module.exports.getBasePath = (path, options) => {
  const tokens = ptr.parse(path, Object.assign({}, defaultOptions, options));
  const prefixPath = tokens[0];
  if (typeof prefixPath !== 'string') {
    return '';
  }
  const regexPath = tokens[1];
  if (regexPath && !regexPath.prefix) {
    return Path.dirname(prefixPath);
  } else {
    return prefixPath;
  }
};
