// PC
const courseWeb = require('../projects/course_web'); // courseweb项目
const uaWeb = require('../projects/ua-web'); // ua-web
const umoocView = require('../projects/umooc-view'); // umooc-view
const umoocStatic = require('../projects/umooc-static'); // umooc-static
const umoocWeb = require('../projects/umooc-web'); // umooc-web
const smartClassroom = require('../projects/smart-classroom'); // smart-classroom

// mobile
const activity1 = require('../projects/activity-1.0');
const activity2 = require('../projects/activity-2.0');
const discussion = require('../projects/discussion');
const exam = require('../projects/exam');
const umoocMobile = require('../projects/umooc-mobile');

// PC & mobile
const homework = require('../projects/homework');

module.exports = [
  courseWeb,
  uaWeb,
  umoocStatic,
  umoocView,
  umoocWeb,
  smartClassroom,
  activity1,
  activity2,
  discussion,
  exam,
  umoocMobile,
  homework
];
