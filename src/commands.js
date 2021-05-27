const { getProjects } = require('./tasks/get-projects');
const { checkProperties } = require('./check/check-properties-key-in-js');
const { checkTranslation } = require('./check/check-translation');
const { ApplyTask, StoreTask } = require('./tasks/task');
const chalk = require('chalk');
const fs = require('fs');
const log = require('./utils/log');

const { store, apply } = require('./ckeditor/ckeditor');

const exec = async (config, projects, Task) => {
  if (!fs.existsSync(config.repo)) {
    log.error(`repo: 仓库路径 - ${config.repo}不存在`);
    process.exit(1);
  }
  if (projects.length === 0) {
    console.log(chalk.yellow('任务列表为空'));
  }

  const taskList = new Array(projects.length);

  projects.forEach((project, index) => {
    taskList[index] = {
      name: project.name,
      groups: project.groups.map((it) => {
        const group = new Task(it, project, config);
        group.check();
        return group;
      })
    };
  });

  for (let i = 0; i < taskList.length; i++) {
    const item = taskList[i];
    console.log(`正在转换 ${item.name} 项目的翻译文本文件...`);
    for (let i = 0; i < item.groups.length; i++) {
      const group = item.groups[i];
      await group.start();
    }
    if (!config.list && !config.dryRun) {
      for (let i = 0; i < item.groups.length; i++) {
        const group = item.groups[i];
        const count = await group.write();
        if (count > 0) {
          console.log(chalk.green.bold(`${item.name}${group.name ? ':' + group.name : ''}`));
          console.log(chalk.green(`转换完成：共转换了${count}个文件`));
        }
      }
    }
  }
};

module.exports.store = async (config) => {
  const projects = getProjects(config);
  await exec(config, projects, StoreTask);
  if (!config.excludeCkeditor) {
    console.log(`正在转换 ckeditor 插件翻译文本 ...`)
    await store(config, projects);
  }
};

module.exports.apply = async (config) => {
  const projects = getProjects(config);
  await exec(config, projects, ApplyTask);
  if (!config.excludeCkeditor) {
    console.log(`正在转换 ckeditor 插件翻译文本 ...`)
    await apply(config, projects);
  }
};

module.exports.list = (config) => {
  const projects = getProjects(config);
  const nameCol = 'name';
  const aliasCol = 'alias';
  const groupsCol = 'groups';
  const nameLength = Math.max(nameCol.length, ...projects.filter((it) => it.name).map((it) => it.name && it.name.length));
  const aliasLength = Math.max(aliasCol.length, ...projects.filter((it) => it.alias).map((it) => it.alias && it.alias.length));
  const gutter = ' '.repeat(8);
  const header = `${nameCol.padEnd(nameLength, ' ')}${gutter}${aliasCol.padEnd(aliasLength, ' ')}${gutter}${groupsCol}`;
  console.log(header);
  console.log('-'.repeat(header.length + 8));

  const log = (name, alias, groups) => {
    const nameColumn = (name || '').padEnd(nameLength, ' ');
    const aliasColumn = (alias || '').padEnd(aliasLength, ' ');
    const groupsColumn = groups.join(' ');
    console.log(`${chalk.green(nameColumn)}${gutter}${chalk.cyan(aliasColumn)}${gutter}${chalk.yellow(groupsColumn)}`);
  };
  for (let i = 0; i < projects.length; i++) {
    const { name, groups, alias } = projects[i];
    log(
      name,
      alias,
      groups.map((it) => it.name)
    );
  }
};

module.exports.check = (config, options) => {
  if (options.translation) {
    checkTranslation(config, options);
  } else if (options.properties) {
    checkProperties(config, options);
  } else {
    console.log(chalk.yellow('似乎没有要执行的动作'));
  }
};
