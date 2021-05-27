const { program } = require('commander');
const { store, apply, list, check } = require('./commands');
const { getConfig } = require('./options/config');

program.storeOptionsAsProperties(false).passCommandToAction(false);
program.version('0.1.0');

program
  .name('ut')
  .description('ulearning 翻译转换工具')
  .option('-c --config [path]', '使用指定的配置，默认为~/.ut.json')
  .option('-o --locales <locales...>', '仅转换指定的语言，默认store子命令仅转换中文，apply子命令转换全部语言')
  .option('-b --only-template', '仅转换中文，等同于 --locales=zh')
  .option('-e --exclude-locales <locales...>', '指定要排除的语言')
  .option('-u --exclude-template', '排除中文进行转换')
  .option('-l --list', '不进行转换，仅列出要转换的文件列表')
  .option('-n --dry-run', '仅进行转换，不写入文件中')
  .option('-B --branch <branch>', '指定默认分支')
  .option('--no-fill', '禁止将未翻译的文本使用中文补全')
  .option('-K --exclude-ckeditor', '是否禁止转换ckeditor');

program
  .command('store [tasks...]')
  .option('-X --no-only-template', '取消默认仅转换中文的限制')
  .description('将本地项目里的翻译资源转换并存储到上游仓库中')
  .action((tasks, options) => {
    const globalOptions = program.opts();
    globalOptions.onlyTemplate = options.onlyTemplate;
    const config = getConfig(globalOptions, tasks);
    store(config, options);
  });

program
  .command('apply [tasks...]')
  .description('将上游仓库的翻译资源转换并应用到本地项目中')
  .action((tasks, options) => {
    const globalOptions = program.opts();
    const config = getConfig(globalOptions, tasks);
    apply(config, options);
  });

program
  .command('list [tasks...]')
  .description('列出可用的任务名称及其别名')
  .action((tasks, options) => {
    const globalOptions = program.opts();
    const config = getConfig(globalOptions, tasks);
    list(config, options);
  });

program
  .command('check')
  .description('辅助工具')
  .option('--translation', '检查当前的翻译情况，例如没有翻译的文件和字段，插值格式错误的翻译，包含中文的翻译等')
  .option('--properties', '检查jsp的js标签中的 bean:message 标签的插值否同时包含单引号和双引号')
  .option('-O --output <path>', '指定检查结果要输出的文件')
  .action((options) => {
    const config = getConfig(program.opts());
    check(config, options);
  });

program.parse(process.argv);
