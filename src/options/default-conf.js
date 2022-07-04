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
    },
    'smart_classroom_admin': {
      alias: 'sca'
    },
    'zambia-admin': {
      alias: 'za'
    },
    'exam_web': {
      alias: 'exw'
    },
    discussion2: {
      alias: 'ds2'
    },
    admin2: {
      alias: 'adm'
    },

  },
  excludeLocales: ['pt', 'ru', 'ug'],
  excludeCkeditor: false // 是否排除ckeditor
};