const { store } = require('./store');
const { apply } = require('./apply');
const log = require('../utils/log');
const { getPlugins, projects } = require('./utils');
const chalk = require('chalk');

const { COURSE_WEB, HOMEWORK, UA_WEB } = projects;

const normalizeOrder = (config, orders) => {
  const { projects } = config;
  const array = [COURSE_WEB, HOMEWORK, UA_WEB];
  const map = new Map();
  array.forEach((name) => {
    const alias = projects[name].alias;
    map.set(name, name);
    if (alias) {
      map.set(alias, name);
    }
  });
  const list = [];
  const invlaids = [];
  for (let i = 0; i < orders.length; i++) {
    const project = orders[i];
    if (map.has(project)) {
      list.push(map.get(project));
    } else {
      invlaids.push(project);
    }
  }
  if (invlaids.length > 0) {
    console.warn(chalk.yellow(`warn: ${invlaids.join(' ')} 不是有效的任务名称`));
  }
  return list;
};

const contactOrder = (order1, order2) => {
  const union = new Set([...order1, ...order2]);
  const set2 = new Set(order2);
  return [...union].filter((it) => set2.has(it));
};

module.exports.ckeditor = async (config, cmdOptions) => {
  if (cmdOptions.store && cmdOptions.apply) {
    log.error('不能同时执行store和apply任务');
    process.exit(1);
  } else if (cmdOptions.store || cmdOptions.apply) {
    cmdOptions.order = normalizeOrder(config, cmdOptions.order || []);
    const plugins = getPlugins(config);
    Object.keys(plugins).forEach((name) => {
      const list = plugins[name];
      if (list.length > 0) {
        const map = list.reduce((accu, item) => {
          accu[item.project] = item;
          return accu;
        }, {});
        const newList = contactOrder(
          cmdOptions.order,
          list.map((it) => it.project)
        );
        plugins[name] = newList.map((name) => map[name]);
      }
    });
    if (cmdOptions.store) {
      await store(config, cmdOptions, plugins);
    } else if (cmdOptions.apply) {
      await apply(config, cmdOptions, plugins);
    }
  }
};
