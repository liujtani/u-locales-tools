const { program } = require('commander');
const { initConfig } = require('./config');
const { store, apply, list, check } = require('./commands');
const { ckeditor } = require('./ckeditor/ckeditor');

program.storeOptionsAsProperties(false).passCommandToAction(false);
program.version('0.1.0');

const mergeConfig = (options, tasks) => {
  const opts = Object.assign(program.opts(), options);
  opts.includeTasks = tasks || [];
  const config = initConfig(opts);
  return { opts, config };
};

program
  .name('ut')
  .description('ulearning 翻译转换工具')
  .option('-c --config [path]', '使用指定的配置，默认为~/.ut.json')
  .option('-o --locales <locales...>', '仅转换指定的语言，默认store子命令仅转换中文，apply子命令转换全部语言')
  .option('-b --templates', '仅转换中文，等同于 --locales=zh')
  .option('-e --exclude-locales <locales...>', '指定要排除的语言')
  .option('-u --exclude-templates', '排除中文进行转换')
  .option('-l --list', '不进行转换，仅列出要转换的文件列表')
  .option('-n --dry-run', '仅进行转换，不写入文件中')
  .option('-B --branch <branch>', '指定默认分支')
  .option('--no-fill', '禁止将未翻译的文本使用中文补全');

program
  .command('store [tasks...]')
  .option('-X --no-only-template', '取消默认仅转换中文的限制')
  .description('将本地项目里的翻译资源转换并存储到上游仓库中')
  .action((tasks, options) => {
    const { config, opts } = mergeConfig(options, tasks);
    store(config, opts);
  });

program
  .command('apply [tasks...]')
  .description('将上游仓库的翻译资源转换并应用到本地项目中')
  .action((tasks, options) => {
    const { config, opts } = mergeConfig(options, tasks);
    apply(config, opts);
  });

program
  .command('list')
  .description('列出可用的任务名称及其别名')
  .action((tasks, options) => {
    const { config, opts } = mergeConfig(options);
    list(config, opts);
  });

program
  .command('ckeditor')
  .description('ckeditor 插件翻译转换')
  .option('-S --store', '将指定项目的ckeditor插件翻译同步到上游仓库')
  .option('-A --apply', '将上游仓库的ckeditor插件翻译同步到本地')
  .option('-X --no-only-template', '取消默认仅转换中文的限制')
  .option('--order <projects...>', '选择要同步的项目，默认顺序是 course_web，umooc_homework_front, ua_web，支持alias')
  .action((options) => {
    if (options.apply && options.onlyTemplate) {
      options.onlyTemplate = false;
    }
    const { config, opts } = mergeConfig(options);
    ckeditor(config, opts);
  });

program
  .command('check')
  .description('辅助工具')
  .option('--translation', '检查当前的翻译情况，例如没有翻译的文件和字段，插值格式错误的翻译，包含中文的翻译等')
  .option('--properties', '检查jsp的js标签中的 bean:message 标签的插值否同时包含单引号和双引号')
  .option('-O --output <path>', '指定检查结果要输出的文件')
  .action((options) => {
    const opts = Object.assign(program.opts(), options);
    const config = initConfig(opts);
    check(config, opts);
  });

program.parse(process.argv);
