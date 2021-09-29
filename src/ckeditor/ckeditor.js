const { store } = require('./store');
const { apply } = require('./apply');
const { getPlugins } = require('./utils');
const chalk = require('chalk');

const startLog = () => {
  console.log(`正在转换 ${chalk.red.bold('ckeditor')} 插件翻译文本 ...`);
};

module.exports.store = async (config, projects) => {
  const plugins = getPlugins(projects);
  if (Object.keys(plugins).length > 0) {
    startLog()
    await store(config, plugins);
  }
};
module.exports.apply = async (config, projects) => {
  const plugins = getPlugins(projects);
  if (Object.keys(plugins).length > 0) {
    startLog()
    await apply(config, plugins);
  }
};
