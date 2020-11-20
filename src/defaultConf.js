module.exports = {
  repo: '../ulearning-asia',
  basePath: '',
  defaultBranch: 'bugfix', // 默认分支，默认为空字符串
  projects: {
    course_web: {
      path: '../course_web',
      alias: 'cw'
    },
    'ulearning_mobile_1.0': {
      alias: 'um1',
      path: '../ulearning_mobile_1.0',
      branch: 'trunk'
    },
    'ulearning_mobile_2.0': {
      alias: 'um2',
      path: '../ulearning_mobile_2.0'
    },
    umooc_homework_front: {
      alias: 'hw',
      path: '../umooc_homework_front'
    },
    discussion: {
      alias: 'ds',
      path: '../discussion'
    },
    exam: {
      alias: 'ex',
      path: '../exam'
    },
    ua_web: {
      alias: 'uaw',
      path: '../ua_web'
    },
    'umooc-static': {
      alias: 'us',
      path: '../umooc-static'
    },
    'umooc-view': {
      alias: 'uv',
      path: '../umooc-view'
    },
    'umooc-mobile': {
      alias: 'um',
      path: '../umooc-mobile'
    },
    'umooc-web': {
      alias: 'uw',
      path: '../umooc-web'
    },
    'smart-classroom': {
      alias: 'sc'
    }
  },
  excludeLocales: ['pt', 'ru', 'fr', 'ug'],
  excludeTasks: ['smart-classroom']
};
