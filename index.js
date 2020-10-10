const { src, dest, series } = require('gulp');
const filter = require('gulp-filter');
const { configs, l2rTasks, r2lTasks } = require('./src/tasks/tasks');
const convertLocal = require('./src/transform/transLocal');
const convertRemote = require('./src/transform/transRemote');
const { mergeLocales } = require('./src/transform/merge');
const { count } = require('./src/utils/count');
const { checkRemoteKey } = require('./src/check/check-remote-key');
const { checkProperties } = require('./src/check/check-properties-key-in-js');
const { checkInterpolation } = require('./src/check/check-interpolation');
const { checkChinese } = require('./src/check/check-chinese');
const fs = require('fs');

const localesMap = {
  zh: 'templates',
  'zh-cn': 'templates',
  tw: 'zh-TW'
};

const { program } = require('commander');
program.version('0.0.1');

// 本地代码转换为翻译平台数据
const local2Remote = (config, locales) => {
  let stream = src(config.localGlob);
  if (locales.length > 0) {
    stream = stream.pipe(
      filter((file) => {
        const remoteLocale = config.getLocaleByLocal(file.path);
        const result = locales.findIndex(locale => locale === remoteLocale.toLowerCase()) > -1;
        return result
      })
    );
  }
  return stream
    .pipe(count(config, config.localGlob))
    .pipe(convertLocal(config))
    .pipe(dest((file) => file.base));
};

// 平台数据转换为本地代码
const remote2Local = (config, options, localFiles) => {
  let stream = src(config.remoteGlob);
  // 不同步更新远程的中文文本
  if (options.excludeLocales.length > 0) {
    stream = stream.pipe(
      filter((file) => {
        return !(options.excludeLocales.findIndex(locale => locale === config.getLocaleByRemote(file.path).toLowerCase()) > -1);
      })
    );
  }
  return stream
    .pipe(count(config, config.remoteGlob))
    .pipe(convertRemote(config, localFiles, options.withMerge))
    .pipe(dest((file) => file.base));
};

const l2r = (locales) =>
  series([
    ...configs.map((config) => {
      return () => local2Remote(config, locales);
    }),
    ...l2rTasks.map((task) => () => task(locales))
  ]);

const localFiles = {};
const r2l = (options) =>
  series([
    ...configs.map((config) => {
      const arr = [() => remote2Local(config, options, localFiles)];
      if (options.withMerge && config.needMerge) {
        arr.push(() => mergeLocales(config, localFiles));
      }
      if (config.otherDest) {
        arr.push(
          Array.isArray(config.otherDest)
            ? series(
                config.otherDest.map((d) => {
                  return src(config.localGlob).pipe(dest(d));
                })
              )
            : () => src(config.localGlob).pipe(dest(config.otherDest))
        );
      }
      return series(arr);
    }),
    ...r2lTasks.map((task) => () => task(options))
  ]);

program
  .command('l2r')
  .description('将本地项目里的翻译资源转换为 Pontoon 可用的翻译格式')
  .option('-l --locale <locales...>', '仅转换指定的语言，默认是所有语言都转换')
  .option('-t --templates', '仅转换中文，等同于 --locale=zh')
  .action((options) => {
    let locales = [];
    if (options.templates) {
      locales = ['templates'];
    }
    if (options.locale) {
      locales = options.locale.map((it) => {
        const locale = it.toLowerCase()
        return localesMap[locale] || locale
      });
    }
    l2r(locales)();
  });

program
  .command('r2l')
  .description('将 Pontoon 的翻译资源转换为本地项目可用的格式')
  .option('-m --merge', '转换后，将未翻译的字段使用中文合并')
  .option('-u --exclude-templates', '排除中文进行转换')
  .action((options) => {
    let locales = options.excludeTemplates ? ['templates'] : []
    locales = locales.map(it => it.toLowerCase())
    r2l({ withMerge: options.merge, excludeLocales:  locales })();
  });

program
  .command('merge')
  .description('将本地项目中未翻译的字段使用中文合并')
  .action(() => {
    r2l()();
  });

program
  .command('check [items...]')
  .description('辅助功能，检查翻译资源的格式和字段的值等')
  .option('-o --output <path>', '指定检查结果输出的目录，默认为.log目录')
  .action(async (items, options) => {
    const checkItems = {
      'remote-key': checkRemoteKey, // 检查
      properties: checkProperties,
      polation: checkInterpolation,
      chinese: checkChinese
    };
    items.forEach((item) => {
      if (!checkItems[item]) {
        console.warn(`warn: ${item} 检查项目不存在`);
        process.exit(0)
      }
    });
    if (items.length === 0) {
      items = Object.keys(checkItems)
    }
    const output = options.output || '.log';
    if (!fs.existsSync(output)) {
      fs.mkdirSync(output);
    }
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (checkItems[item]) {
        await checkItems[item](output);
      }
    }
  });

program.parse(process.argv);
