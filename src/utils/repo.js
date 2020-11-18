const Path = require('path');
const fs = require('fs');
const fsp = fs.promises;
const { parse, parseLines } = require('dot-properties');
const { json, properties } = require('../parse-tool');
const { walk } = require('./extra');

const getRepoRescourse = async (repoPath, hasComment = true) => {
  const filelist = [];
  await walk(repoPath, (path) => {
    const ext = Path.extname(path).slice(1);
    // 目前还不支持其他格式的文件
    if (ext === json || ext === properties) {
      filelist.push(path);
    }
  });
  const list = [];
  await Promise.all(
    filelist.map(async (file) => {
      const { ext, dir } = Path.parse(file);
      const type = ext.slice(1).toLowerCase();
      const locale = Path.basename(dir);
      const text = await fsp.readFile(file, { encoding: 'utf-8' });
      let obj;
      if (type === json) {
        obj = JSON.parse(text);
        if (!hasComment) {
          Object.keys(obj).forEach((key) => {
            obj[key] = obj[key].message;
          });
        }
      } else {
        if (hasComment) {
          obj = parseLines(text, true);
        } else {
          obj = parse(text);
        }
      }
      list.push({ obj, locale, path: file, type });
    })
  );
  return list;
};

module.exports.getRepoRescourse = getRepoRescourse;