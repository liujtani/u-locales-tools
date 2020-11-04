const { program } = require('commander');
const { store, apply } = require('./commands');
const { checkTranslation } = require('./check/check-translation');
const { checkProperties } = require('./check/check-properties-key-in-js');
const { initConfig } = require('./config');

program.storeOptionsAsProperties(false).passCommandToAction(false);
program.version('0.1.0');

program
  .name('ut')
  .description('ulearning 翻译转换工具')
  .option('-c --config [path]', '使用指定的配置，默认为~/.ut.json')
  .option('-l --locales <locales...>', '仅转换指定的语言，默认所有语言都转换')
  .option('-t --templates', '仅转换中文，等同于 --locales=zh')
  .option('-e --exclude-locales <locales...>', '指定要排除的语言')
  .option('-u --exclude-templates', '排除中文进行转换')
  .option('-o --output <path>', '指定检查结果要输出的文件');

program
  .command('store')
  .description('将本地项目里的翻译资源转换并存储到上游仓库中')
  .action(() => {
    initConfig(program.opts());
    store();
  });

program
  .command('apply')
  .description('将上游仓库的翻译资源转换并应用到本地项目中')
  .option('-m --fill-translation', '是否同时将为翻译的文本使用中文补全')
  .action((options) => {
    initConfig(program.opts(), options);
    apply();
  });

const checkList = [
  { command: 'check-translation', desc: '检查当前的翻译情况，例如没有翻译的文件和字段，插值格式错误的翻译，包含中文的翻译等', cb: checkTranslation, alias: 'check-t' },
  { command: 'check-local-prop', desc: '检查jsp中bundle:message对应的值是否同时包含单引号和双引号', cb: checkProperties, alias: 'check-lp' }
];

for (let i = 0; i < checkList.length; i++) {
  const item = checkList[i];
  if (item.alias) {
    program.command(item.alias).action((options) => {
      const config = initConfig(program.opts(), options);
      item.cb(config);
    });
  }
  program
    .command(item.command)
    .description(item.desc)
    .action((options) => {
      const config = initConfig(program.opts(), options);
      item.cb(config);
    });
}

program.parse(process.argv);
