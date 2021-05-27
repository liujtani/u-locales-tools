module.exports = {
  repo: '',
  basePath: '',
  defaultBranch: 'bugfix', // 默认分支，默认为空字符串
  projects: {
    course_web: {
      alias: 'cw',
      branch: 'bugfix2.4'
    },
    'ulearning_mobile_1.0': {
      alias: 'um1',
      branch: 'trunk'
    },
    'ulearning_mobile_2.0': {
      alias: 'um2'
    },
    umooc_homework_front: {
      alias: 'hw'
    },
    discussion: {
      alias: 'ds'
    },
    exam: {
      alias: 'ex'
    },
    ua_web: {
      alias: 'uaw'
    },
    'umooc-static': {
      alias: 'us'
    },
    'umooc-view': {
      alias: 'uv'
    },
    'umooc-mobile': {
      alias: 'um'
    },
    'umooc-web': {
      alias: 'uw'
    },
    'smart-classroom': {
      alias: 'sc'
    }
  },
  excludeLocales: ['pt', 'ru', 'fr', 'ug'],
  excludeTasks: ['smart-classroom'],
  excludeCkeditor: false // 是否排除ckeditor
};
