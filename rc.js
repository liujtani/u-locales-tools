module.exports = {
  remoteRepo: '../ulearning-asia',
  defaultBranch: 'bugfix', // 默认分支，默认为空字符串
  logPath: '.log', // log目录
  projects: {
    course_web: {
      path: '../course_web'
    },
    activity1: {
      path: '../ulearning_mobile_1.0',
      branch: ''
    },
    activity2: {
      path: '../ulearning_mobile_2.0'
    },
    homework: {
      path: '../umooc_homework_front'
    },
    discussion: {
      path: '../discussion',
      branch: ''
    },
    exam: {
      path: '../exam'
    },
    ['ua-web']: {
      path: '../ua_web'
    },
    ['umooc-static']: {
      path: '../umooc-static'
    },
    ['umooc-view']: {
      path: '../umooc-view'
    },
    ['umooc-mobile']: {
      path: '../umooc-mobile',
      // branch: 'test'
    },
    ['umooc-web']: {
      path: '../umooc-web',
      // branch: 'test'
    }
  },
  tasks: {
    include: ['course_web'],
    // include: ['exam', 'course_web', 'ua-web', 'umooc-static', 'umooc-view', 'homework'],
    // include: 'all',
    exclude: []
  }
  // 要开启的任务
  // 1. 默认开启所有的任务，不设置tasks，或者不设置include，都会开启所有的任务
  // 2. include 支持设置为字符串 "all"，开启所有的任务
  // 任务名称以上面projects下的key为准，支持项目里面的子项目，例如
  // course_web 会开启course_web 任务，但是 course_web:screen 则只会开启同步course_web下面的screen项目的同步。
  // example:
  // tasks: undefined // 开启所有任务
  // tasks: { include: 'all' } // 开启所有任务
}