// const { complete } = require('./tasks/complete');
const { loadTasks } = require('./tasks/load-tasks');
const { getConfig } = require('./config');

const apply = async () => {
  const config = getConfig();
  const tasks = loadTasks();
  await Promise.all(
    tasks.map(async (task) => {
      await task.start(config, false);
    })
  );
};

const store = async () => {
  const config = getConfig();
  const tasks = loadTasks();
  await Promise.all(
    tasks.map(async (task) => {
      await task.start(config, true);
    })
  );
};

module.exports.apply = apply;
module.exports.store = store;
