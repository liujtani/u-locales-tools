const { src, dest, parallel, series } = require('gulp');
const filter = require('gulp-filter');
const { configs, l2rTasks, r2lTasks } = require('./src/tasks');
const convertLocal = require('./src/transform/transLocal');
const convertRemote = require('./src/transform/transRemote');
const { mergeLocales } = require('./src/transform/merge');
const minimist = require('minimist');
const { count } = require('./src/utils/count');
const { checkRemoteKey } = require('./src/check/check-remote-key');
const { checkProperties } = require('./src/check/check-properties-key-in-js');

const argv = minimist(process.argv.slice(3));
const withMerge = argv.m || argv.merge;
const onlyTemplate = argv.t || argv.template;

// 本地代码转换为翻译平台数据
const local2Remote = (config) => {
  let stream = src(config.localGlob);
  if (onlyTemplate) {
    stream = stream.pipe(
      filter((file) => {
        return config.isLocalTemplate(file.path);
      })
    );
  }
  return stream
    .pipe(count(config, config.localGlob))
    .pipe(convertLocal(config))
    .pipe(dest((file) => file.base));
};

// 平台数据转换为本地代码
const remote2Local = (config, withMerge) => {
  let stream = src(config.remoteGlob)
  // 不同步更新远程的中文文本
  if (onlyTemplate) {
    stream = stream.pipe(filter(file => {
      return !config.isRemoteTemplate(file.path)
    }))
  }
  return stream
    .pipe(count(config, config.remoteGlob))
    .pipe(convertRemote(config, withMerge))
    .pipe(dest((file) => file.base));
};

const l2r = parallel([
  ...configs.map((config) => {
    return () => local2Remote(config);
  }),
  ...l2rTasks.map((task) => () => task(onlyTemplate))
]);

const r2l = parallel([
  ...configs.map((config) => {
    const arr = [() => remote2Local(config, withMerge)];
    if (withMerge && config.needMerge) {
      arr.push(() => mergeLocales(config));
    }
    if (config.otherDest) {
      arr.push(
        Array.isArray(config.otherDest)
          ? parallel(
              config.otherDest.map((d) => {
                return src(config.localGlob).pipe(dest(d));
              })
            )
          : () => src(config.localGlob).pipe(dest(config.otherDest))
      );
    }
    return series(arr);
  }),
  ...r2lTasks.map((task) => () => task(withMerge))
]);

exports.l2r = l2r;
exports.r2l = r2l;

const check = (callback) => {
  const set = new Set(argv._);
  const tasks = {
    remoteKey: checkRemoteKey,
    properties: checkProperties
  };
  const arr = Object.keys(tasks).reduce((arr, key) => {
    if (set.has(key)) {
      tasks[key].displayName = key;
      arr.push(tasks[key]);
    }
    return arr;
  }, []);
  if (arr.length === 0) {
    console.warn('没有指定任何检查任务');
    callback();
  } else {
    return series(arr);
  }
};

exports.check = check;
