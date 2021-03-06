const invert = require('lodash/invert');
const chalk = require('chalk');
const Path = require('path');

const logList = (list) => {
  list = list.filter((it) => !it.hidden);
  const len = 'templates'.length;
  const srcMax = Math.max(...list.flatMap((it) => it.src).map((it) => it.length));
  const dstMax = Math.max(...list.flatMap((it) => it.dst).map((it) => it.length));
  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    let prefix = item.locale.padEnd(len, ' ');
    const src = Array.isArray(item.src)
      ? item.src
          .map((it) => it.padEnd(srcMax, ' '))
          .map((it, index) => (index > 0 ? ' '.repeat(prefix.length + 2) + it : it))
          .join('\n')
      : item.src.padEnd(srcMax, ' ');
    const dst = Array.isArray(item.dst)
      ? item.dst
          .map((it) => it.padEnd(dstMax, ' '))
          .map((it, index) => (index > 0 ? ' '.repeat(prefix.length + 2 + srcMax + 4) + it : it))
          .join('\n')
      : item.dst.padEnd(dstMax, ' ');
    console.log(`${chalk.blue(prefix)} `, chalk.cyan(src), '->', chalk.yellow(dst));
    console.log('\n');
  }
  if (list.length === 0) {
    console.log(chalk.yellow('没有匹配到要转换的文件，请检查相关的路径和语言设置'));
  }
};

const localeMap = {
  templates: 'zh-cn',
  'zh-TW': 'zh'
};

const invertLocaleMap = invert(localeMap);

const COURSE_WEB = 'course_web';
const HOMEWORK = 'umooc_homework_front';
const UA_WEB = 'ua_web';

const getPlugins = (projects) => {
  const getPath = (name, suffix) => {
    const index = projects.findIndex((project) => project.name === name);
    if (index > -1) {
      return { project: name, path: Path.join(projects[index].basePath, suffix, 'ckeditor/plugins') };
    }
    return null;
  };
  const courseWeb = getPath(COURSE_WEB, 'www/common/vendor');
  const homework = getPath(HOMEWORK, 'ulearning/static/3rdlib');
  const uaWeb = getPath(UA_WEB, 'src/common/lib');

  const plugins = {
    attachMathJax: [homework],
    imageUploader: [courseWeb, homework],
    simplelink: [courseWeb, homework, uaWeb],
    kityformula: [uaWeb],
    addNotes: [uaWeb],
    embedHtml: [uaWeb]
  };

  const list = {};

  Object.keys(plugins).forEach((key) => {
    const projects = plugins[key].filter(it => it);
    if (projects.length > 0) {
      list[key] = projects;
    }
  });

  return list;
};

const sort = (list) => {
  return list.sort((a, b) => {
    if (a.locale === 'templates' && b.locale === 'templates') return 0;
    if (a.locale === 'templates') return -1;
    if (b.locale === 'templates') return 1;
    return 0;
  });
};

module.exports.logList = logList;
module.exports.localeMap = localeMap;
module.exports.invertLocaleMap = invertLocaleMap;
module.exports.getPlugins = getPlugins;
module.exports.projects = {
  COURSE_WEB,
  HOMEWORK,
  UA_WEB
};
module.exports.sort = sort;
