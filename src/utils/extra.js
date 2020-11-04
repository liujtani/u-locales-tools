const Path = require('path');
const fs = require('fs');
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
      if (status === false) break
    } else if (stats.isDirectory()) {
      const status = await travel(fullPath, callback);
      if (status === false) break
    }
  }
};

const walk = async (path, callback = () => {}) => {
  const stats = await fsp.stat(path);
  if (stats.isDirectory()) {
    await travel(path, callback);
  } else if (stats.isFile() || stats.isSymbolicLink()) {
    return callback(path);
  }
};

module.exports.hasChinese = hasChinese;
module.exports.walk = walk;
