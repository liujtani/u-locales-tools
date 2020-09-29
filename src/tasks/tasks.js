const flatten = require('lodash/flatten');
const { Config } = require('../config/index');
const { rc } = require('../utils/rc');

// PC
const courseWeb = require('../loaders/course_web'); // courseweb项目
const uaWeb = require('../loaders/ua-web'); // ua-web
const umoocView = require('../loaders/umooc-view'); // umooc-view
const umoocStatic = require('../loaders/umooc-static'); // umooc-static
const umoocWeb = require('../loaders/umooc-web'); // umooc-web
const smartClassroom = require('../loaders/smart-classroom'); // smart-classroom

// mobile
const activity1 = require('../loaders/activity-1.0');
const activity2 = require('../loaders/activity-2.0');
const discussion = require('../loaders/discussion');
const exam = require('../loaders/exam');
const umoocMobile = require('../loaders/umooc-mobile');

// PC & mobile
const homework = require('../loaders/homework');

// common
const attachMathJax = require('../loaders/common/attachMathJax')

// ckeditor
const ckeditor = require('./ckeditor');

let tasks = {
  [ckeditor.project]: ckeditor
};
let loaders = flatten([courseWeb, uaWeb, umoocStatic, umoocView, umoocWeb, smartClassroom, activity1, activity2, discussion, exam, umoocMobile, homework, attachMathJax]);
const projectSet = new Set(loaders.map((it) => it.project).concat([ckeditor.project]));
const outputInvalidTasks = (set, log) => {
  const invalid = [];
  set.forEach((key) => {
    if (!projectSet.has(key)) {
      invalid.push(key);
    }
  });
  if (invalid.length > 0) {
    console.warn(log);
    console.warn(invalid.join('  '));
  }
}

if (Array.isArray(rc.tasks.include) && rc.tasks.include.length > 0) {
  const set = new Set(rc.tasks.include);
  outputInvalidTasks(set, 'tasks.include 包含以下无效的任务名称')
  loaders = loaders.filter((loader) => {
    const { project } = loader;
    return set.has(project) || project.split(':').slice(0, -1).some(p => set.has(p))
  });
  tasks = Object.keys(tasks).reduce((accu, name) => {
    if (set.has(name) || name.split(':').slice(0, -1).some(n => set.has(n))) {
      accu[name] = tasks[name];
    }
    return accu;
  }, {});
}

if (Array.isArray(rc.tasks.exclude) && rc.tasks.exclude.length > 0) {
  const set = new Set(rc.tasks.exclude);
  outputInvalidTasks(set, 'tasks.exclude 包含以下无效的任务名称')
  loaders = loaders.filter((loader) => {
    const { project } = loader;
    return !set.has(project) && project.split(':').slice(0, -1).every(p => !set.has(p));
  });
  tasks = Object.keys(tasks).reduce((accu, name) => {
    if (!set.has(name) && name.split(':').slice(0, -1).every(n => !set.has(n))) {
      accu[name] = tasks[name];
    }
    return accu;
  }, {});
}

module.exports.configs = loaders.map((config) => {
  return new Config(config);
});

module.exports.l2rTasks = Object.values(tasks).map((it) => it.l2r);
module.exports.r2lTasks = Object.values(tasks).map((it) => it.r2l);
