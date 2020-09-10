const omit = require('lodash/omit');
const { getRemoteData } = require('../utils/remote');

module.exports.checkRemoteKey = async () => {
  const map = await getRemoteData()
  const files = new Set();
  Object.keys(omit(map, ['templates'])).forEach((locale) => {
    Object.keys(map[locale]).forEach((file) => {
      if (!map.templates[file]) {
        files.add(file);
        return;
      }
      const arr = [];
      Object.keys(map[locale][file]).forEach((key) => {
        if (!map.templates[file][key]) {
          arr.push(key);
        }
      });
      if (arr.length > 0) {
        console.log(`${locale} - ${file}`);
        console.log(arr.join('    '));
        console.log('\n');
      }
    });
  });
  if (files.size > 0) {
    console.log('缺少的文件有：');
    console.log([...files].join('    '));
    console.log('\n');
  }
};
