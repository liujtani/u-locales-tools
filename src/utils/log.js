const chalk = require('chalk');

const error = (str) => {
  console.log(`${chalk.red(str)}`);
};

const len = 'templates'.length;

const list = (list) => {
  const max = Math.max(...list.map((it) => it.src.length));
  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    console.log(`${chalk.blue(item.locale.padEnd(len, ' '))} ${chalk.cyan(item.src.padEnd(max, ' '))}  ->  ${chalk.yellow(item.dst)}`);
  }
  console.log();
  if (list.length === 0) {
    console.log(chalk.yellow('没有匹配到要转换的文件，请检查相关的路径和语言设置'));
  }
};

module.exports.list = list;
module.exports.error = error;
