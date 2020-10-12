const cloneDeep = require('lodash/cloneDeep');
const merge = require('lodash/merge');
const Path = require('path');
const rc = require('../../rc');
const config = merge(
  {
    defaultBranch: '',
    logPath: './.log',
    tasks: {
      include: 'all',
      exclude: []
    }
  },
  cloneDeep(rc)
);

if (config.remoteRepo === undefined) {
  console.error('必须提供上游仓库的地址');
  process.exit(1);
}

if (typeof config.remoteRepo !== 'string') {
  console.error('仓库地址应为字符串');
  process.exit(1);
}

if (typeof config.defaultBranch !== 'string') {
  console.error('分支/分组名称应为字符串');
  process.exit(1);
}

if (config.tasks.include !== 'all' && !Array.isArray(config.tasks.include)) {
  console.error('包含任务列表应该是一个关键字 all 或者是一个数组');
  process.exit(1);
}

if (!Array.isArray(config.tasks.exclude)) {
  console.error('排除列表应该是一个数组');
  process.exit(1);
}

if (!Array.isArray(config.tasks.include)) {
  config.tasks.include = Object.keys(config.projects)
}

module.exports.rc = config;
module.exports.getPath = (project, path) => {
  if (!config.projects[project]) {
    return ''
  }
  return Path.posix.join(config.projects[project].path, typeof config.projects[project].branch === 'string' ? config.projects[project].branch : config.defaultBranch, path);
};
