const chalk = require('chalk');
const projects = require('./projects');
const { getProjectPath } = require('../utils/repo');

const checkTasks = (config) => {
  const set = new Set();
  for (let i = 0; i < projects.length; i++) {
    const project = projects[i];
    const { name, groups } = project;
    const opts = config.projects[name];
    const alias = opts && opts.alias;
    set.add(name);
    if (alias) {
      set.add(alias);
    }
    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];
      if (group.name) {
        set.add(`${name}:${group.name}`);
        alias && set.add(`${alias}:${group.name}`);
      }
    }
  }
  const check = (tasks, name) => {
    const list = tasks.filter((it) => !set.has(it));
    if (list.length > 0) {
      console.warn(chalk.yellow(`warn: ${name} - ${list.join(' ')} 不是有效的任务名称`));
    }
  };
  check(config.includeTasks, 'includeTasks');
  check(config.excludeTasks, 'excludeTasks');
};

const hasProject = (name, alias, tasks) => {
  return tasks.indexOf(name) > -1 || (alias && tasks.indexOf(alias) > -1);
};

const hasGroup = (projectName, groupName, alias, tasks) => {
  const name = `${projectName}:${groupName}`;
  const compositeAlias = `${alias}:${groupName}`;
  return tasks.indexOf(name) > -1 || (alias && tasks.indexOf(compositeAlias) > -1);
};

const mergeProjects = (projects, config) => {
  return projects.map((project) => {
    const opts = config.projects[project.name];
    if (opts) {
      Object.assign(project, opts, {
        basePath: getProjectPath(config, project.name)
      });
    }
    return project;
  });
};

const getProjects = (config) => {
  checkTasks(config);

  const list = [];

  projects.forEach((project) => {
    const opts = config.projects[project.name];
    const alias = opts && opts.alias;
    const flag = (config.includeTasks.length === 0 || hasProject(project.name, alias, config.includeTasks)) && !hasProject(project.name, alias, config.excludeTasks);
    if (flag) {
      list.push(project);
    } else {
      const groups = project.groups.filter((group) => {
        if (!group.name) return flag;
        return hasGroup(project.name, group.name, alias, config.includeTasks) && !hasGroup(project.name, group.name, alias, config.excludeTasks);
      });
      if (groups.length > 0) {
        list.push({ name: project.name, groups });
      }
    }
  });
  return mergeProjects(list, config);
};

module.exports.getProjects = getProjects;
