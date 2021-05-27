const { store } = require('./store');
const { apply } = require('./apply');
const { getPlugins } = require('./utils');

module.exports.store = async (config, projects) => {
  const plugins = getPlugins(projects);
  await store(config, plugins);
};
module.exports.apply = async (config, projects) => {
  const plugins = getPlugins(projects);
  await apply(config, plugins);
};
