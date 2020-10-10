
## 使用

```bash
node index.js -h # 显示通用选项帮助

node index.js l2r -h # 显示 l2r 子命令的帮助
node index.js l2r # 本地同步到远程
node index.js l2r -t # 仅同步中文
node index.js l2r -l en # 仅同步英文
node index.js l2r -l en es # 仅同步英文和西班牙语

node index.js r2l -h # 显示 r2l 子命令的帮助
node index.js r2l # 远程同步到本地
node index.js r2l -m # 远程同步到本地，并在本地自动合并
node index.js r2l -u # 转换时，排除中文文件，如果你在本地增加了一些中文文本，并且还不想现在就放到翻译平台上，那么可以使用这个命令不更新中文文本
node index.js r2l -m -u

node index.js check # 检查所有项目
node index.js check remote-key # 检查远程仓库中多余的key，比如，中文文件中，没有foo这个key，但在英文文件却存在这个key
node index.js check properties # 检查jsp中script元素中引用的properties中是否含有引号。因为jsp插值不会转义单引号和双引号，因此，当properties的插件插入js中后，会造成解析错误。
node index.js check polation # 检查翻译后的文本，插值是否正确
node index.js check chinese # 检查github上游文件翻译文本中是否包含中文
```

## 语言配置文件结构

优先考虑采用 json 格式，方便管理

## 配置示例

```js
const { json } = require('./src/utils/types');
const Path = require('path');
const _ = require('lodash');
const fs = require('fs');

module.exports = {
  project: 'project-name', // 可选。项目名称
  type: json, // 必填。文件类型，支持 json seajs requirejs 等，可以在 utils/typesa.js中看到
  remoteFilename: 'attachMathJax.json', // 与 remoteGlob 二选一。上游文件名称，这个配置是 remoteGlob 的快捷方式，相当于 **/attachMathJax.json
  // remoteGLob: '**/attachMathJax.json', // 与 remoteFilename 二选一。上游文件glob
  localGlob: '../umooc/static/js/tutor/question/Que/formula/locales/*.json', // 必填。本地文件glob
  fileMap: ['{locale}.json'], // 必填。文件映射，是一个二元数组，第一个元素对应本地文件，第二个元素对应上游文件，第二个元素可以省略，默认就是{locale}/remoteFilename，
  desc: '对应公式编辑器页面', // 必填。上游文件字段的description，支持 fileMap 的写法，详见 course_web.js
  otherDest: '../umooc_homework_front/i18n/ulearning/static/3rdlib/ckeditor/plugins/attachMathJax/locales', // 可选。将生成的本地文件是否复制到其他地方
  needMerge: true, // 可选。默认为true，是否转换到本地的时候，将未翻译的文本合并。这适用于哪些不能自动回退的项目，典型的如jsp的properties。course_web 不需要转换，会自动回退。
  mergeLocal: false, // 可选，默认是false。本地文件向上游文件转换时，需要将key使用.或[]拼接起来，这就要看本地的原文件中不能含有.或[]。但是，有一些项目，必须含有.或[]，例如kindeditor的语言配置文件。mergeLocal如果设置为true，就不会检测本地文件中是否含有.或[]，同时，会分析本地文件，根据本地文件的结构，进行转换。
  // 下面是一些回调
  localParseAfter: (file, obj) => {}, // 本地文件解析问对象后的回调
  // localSerialAfter: () => {}, // 本地文件转换为上游文件的对象结构后的回调
  // remoteParseAfter: () => {}, // 上游文件解析问对象后的回调
  remoteDeserialAfter: (file, obj, src) => {
    return _.merge(src, obj);
  } // 上游文件转换为本地文件的对象结构后的回调
  // mergeCallback: () => {} // 本地文件合并时的回调处理，这个合并指的是非文件翻译文件，合并没有翻译过的中文文本。例如，kindeditor的翻译配置中有一个font.Fontname，这个是不需要合并的。可以在这个回调中处理。
};
```
