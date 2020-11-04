const Path = require('path');
const { getConfig } = require('../config');
const { Task } = require('./Task');
const projects = require('./projects');

const projectNames = projects.map((it) => it.name);

const groupTask = (checkTasks, tasks) => {
  const exclude = [];
  const include = [];
  for (let i = 0; i < checkTasks.length; i++) {
    const name = checkTasks[i];
    const prefix = name.split(':')[0];
    if (tasks.findIndex((it) => it === name || it === prefix) === 0) {
      exclude.push(name);
    } else {
      include.push(name);
    }
  }
  return { exclude, include };
};

const normalizeIncludeTask = (config) => {
  let list;
  if (config.includeTasks === 'all') {
    list = projectNames;
  } else {
    const { exclude, include } = groupTask(config.includeTasks, projectNames);
    if (exclude.length > 0) {
      console.warn('include task 包含以下无效的任务名称');
      console.warn(exclude.join('\n'));
    }
    list = include;
  }
  config.includeTasks = list;
};

const normalizeExcludeTask = (config) => {
  if (config.excludeTasks.length > 0) {
    const { exclude, include } = groupTask(config.excludeTasks, projectNames);
    config.excludeTasks = include;
    if (exclude.length > 0) {
      console.warn('exclude task 包含以下无效的任务名称');
      console.warn(exclude.join('\n'));
    }
  }
};

const getProjectBasepath = (project, config) => {
  let name = project.name || '';
  let projectPath = name;
  let branch = config.defaultBranch || '';
  if (name) {
    name = name.split(':')[0]
    if (config.projects[name]) {
      if (typeof config.projects[name].path === 'string') {
        projectPath = config.projects[name].path;
      }
      if (typeof config.projects[name].branch === 'string') {
        branch = config.projects[name].branch;
      }
    }
  }
  const basePath = Path.join(config.basePath, projectPath, branch);
  if (process.env.NODE_ENV === 'DEBUG') {
    console.log(basePath)
  }
  return basePath;
};

const getProjects = (config) => {
  normalizeIncludeTask(config);
  normalizeExcludeTask(config);
  let includeTasks = config.includeTasks;
  if (config.excludeTasks.length > 0) {
    const { include } = groupTask(includeTasks, config.excludeTasks);
    includeTasks = include;
  }
  const projectList = [];
  for (let i = 0; i < projects.length; i++) {
    const project = projects[i];
    const name = project.name;
    const prefix = name.split(':')[0];
    if (includeTasks.findIndex((it) => it === project.name || it === prefix) > -1) {
      project.basePath = getProjectBasepath(project, config);
      projectList.push(project);
    }
  }
  return projectList;
};

const loadTasks = () => {
  const config = getConfig();
  const list = getProjects(config);
  if (list.length === 0) {
    console.info('没有指定要转换的项目')
  }
  return list.map((project) => {
    if (project.standalone) return project;
    return new Task(project)
  });
};

const getTask = (project) => {
  project.basePath = getProjectBasepath(project, getConfig());
  return new Task(project);
};

module.exports.loadTasks = loadTasks;
module.exports.getTask = getTask;
module.exports.getProjectBasepath = getProjectBasepath