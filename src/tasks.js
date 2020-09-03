const flatten = require('lodash/flatten');
const { Config } = require('./config/index');

// PC
// eslint-disable-next-line
const course_web = require('./loaders/course_web');
// eslint-disable-next-line
const scren = require('./loaders/screen');
// eslint-disable-next-line
const ua = require('./loaders/ua-web');
// eslint-disable-next-line
const umoocView = require('./loaders/umooc-view');
// eslint-disable-next-line
const umoocStatic = require('./loaders/umooc-static');

// mobile
// eslint-disable-next-line
const activity1 = require('./loaders/activity-1.0');
// eslint-disable-next-line
const activity2 = require('./loaders/activity-2.0');
// eslint-disable-next-line
const discussion = require('./loaders/mobile-discuss');
// eslint-disable-next-line
const exam = require('./loaders/mobile-exam');
// eslint-disable-next-line
const umoocModile = require('./loaders/umooc-modile');

// PC & mobile
// eslint-disable-next-line
const homework = require('./loaders/homework');

// 杂项
// eslint-disable-next-line
const kindeditor = require('./loaders/kindeditor');
// eslint-disable-next-line
const my97DatePicker = require('./loaders/my97DatePicker');

// eslint-disable-next-line
const viewProperties = require('./loaders/view-properties');
// eslint-disable-next-line
const webProperties = require('./loaders/web-properties');

// eslint-disable-next-line
const attachMathJax = require('./loaders/attachMathJax');

// eslint-disable-next-line
const smartClassroom = require('./loaders/smart-classroom');

// eslint-disable-next-line
const ckeditor = require('./transform/ckeditor');

const loaders = flatten([
  // course_web // courseweb项目
  // scren, // 投屏
  // ua, // ua-web
  // umoocStatic, // umooc 1.0 使用seajs加载的配置语言
  // umoocView, // umooc 1.0 json 配置

  // activity1, // app1.0 活动，包括小组作业等
  // activity2, // app2.0 活动
  // discussion, // 讨论项目
  // exam, // 手机考试
  // umoocModile, // umooc-modile 项目

  // homework, // 作业

  // kindeditor,
  // my97DatePicker,
  // attachMathJax,
  viewProperties,
  webProperties,
  // smartClassroom
]);

module.exports.configs = loaders.map((config) => {
  return new Config(config);
});

const tasks = [
  // ckeditor
];

module.exports.l2rTasks = tasks.map((it) => it.l2r);
module.exports.r2lTasks = tasks.map((it) => it.r2l);
