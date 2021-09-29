// PC
const courseWeb = require('../projects/course_web'); // courseweb项目
const uaWeb = require('../projects/ua-web'); // ua-web
const umoocView = require('../projects/umooc-view'); // umooc-view
const umoocStatic = require('../projects/umooc-static'); // umooc-static
const umoocWeb = require('../projects/umooc-web'); // umooc-web
const smartClassroom = require('../projects/smart-classroom'); // smart-classroom
const smartClassroomAdmin = require('../projects/smart-classroom-admin') // smart-classroom-admin

// mobile
const activity1 = require('../projects/activity-1.0');
const activity2 = require('../projects/activity-2.0');
const discussion = require('../projects/discussion');
const exam = require('../projects/exam');
const umoocMobile = require('../projects/umooc-mobile');

// PC & mobile
const homework = require('../projects/homework');

// zambia 项目
const zambiaAdmin = require('../projects/zambia-admin')

// exam_web 项目
const examWeb = require('../projects/exam_web')

// 新版讨论项目
const discussion2 = require('../projects/discussion2')

module.exports = [
  courseWeb,
  uaWeb,
  umoocStatic,
  umoocView,
  umoocWeb,
  smartClassroom,
  smartClassroomAdmin,
  activity1,
  activity2,
  discussion,
  exam,
  umoocMobile,
  homework,
  zambiaAdmin,
  examWeb,
  discussion2
];
