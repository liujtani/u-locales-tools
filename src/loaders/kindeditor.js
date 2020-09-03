const { kindeditor } = require('../utils/types');

module.exports = {
  project: 'kindeditor',
  type: kindeditor,
  remoteFilename: 'kindeditor.json',
  localGlob: '../ulearning-travial/kindeditor/*.json',
  fileMap: ['{locale}.json'],
  desc: 'kindeditor 编辑器组件',
  mergeLocal: true,
  localParseAfter: function (file, obj) {
    obj['fontname.fontName'] = undefined;
    return obj;
  },
  mergeCallback: (objValue, srcValue, key) => {
    if (key === 'fontname.fontName') {
      return srcValue;
    }
  }
};
