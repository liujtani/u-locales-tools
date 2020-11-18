const chalk = require('chalk');
const projects = require('./projects');

const invalidTasks = (config, includeTasks, excludeTasks) => {
  const set = new Set();
  for (let i = 0; i < projects.length; i++) {
    const project = projects[i];
    const { name, groups }  = project;
    const alias = config.projects[name].alias;
    set.add(name);
    alias && set.add(alias);
    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];
      if (group.name) {
        set.add(`${name}:${group.name}`)
        alias && set.add(`${alias}:${group.name}`)
      }
    }
  }
  const check = (tasks, name) => {
    const list = [];
    tasks.forEach(task => {
      if (!set.has(task)) {
        list.push(task)
      }
    })
    if (list.length > 0) {
      console.warn(chalk.yellow(`warn: ${name} - ${list.join(' ')} 不是有效的任务名称`))
    }
  };
  check(includeTasks, 'includeTasks');
  check(excludeTasks, 'excludeTasks');
};

const getGroups = (config) => {
  let { includeTasks, excludeTasks } = config;
  includeTasks = new Set(includeTasks || []);
  excludeTasks = new Set(excludeTasks || []);
  const hasTasks = (name, alias, allowEmpty = false) => {
    if (excludeTasks.has(name)) return false;
    if (alias && excludeTasks.has(alias)) return false;
    if (allowEmpty || includeTasks.size > 0) {
      let status = !includeTasks.has(name);
      if (alias) {
        status = status && !includeTasks.has(alias);
      }
      if (status) return false;
    }
    return true;
  };

  const list = [];
  projects.forEach((pro) => {
    const { name, groups } = pro;
    const alias = config.projects[name].alias;
    alias && (pro.alias = alias);
    const flag = hasTasks(name, alias);
    if (flag) {
      list.push(
        ...groups.map((it) => {
          it.project = name;
          return it;
        })
      );
    } else {
      groups.forEach((g) => {
        g.project = name;
        const gname = g.name;
        if (gname) {
          const fullName = `${name}:${gname}`;
          const fullAlias = alias && `${alias}:${gname}`;
          if (hasTasks(fullName, fullAlias, true)) {
            list.push(g);
          }
        }
      });
    }
  });

  invalidTasks(config, excludeTasks, includeTasks);

  return list;
};

module.exports.getGroups = getGroups;
