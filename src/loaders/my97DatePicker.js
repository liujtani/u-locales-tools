const { json } = require('../utils/types');

module.exports = {
  project: 'my97DatePicker',
  type: json,
  remoteFilename: 'my97DatePicker.json',
  localGlob: '../ulearning-travial/my97DatePicker/*.json',
  fileMap: ['{locale}.json'],
  desc: 'my97DatePicker 日期插件 适用于1.0项目',
  needMerge: false
};
