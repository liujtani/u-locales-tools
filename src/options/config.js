const os = require('os');
const Path = require('path');
const fs = require('fs');
const Joi = require('joi');
const yaml = require('yaml');
const { mergeWith } = require('lodash');

const localeMap = {
  zh: 'templates',
  'zh-cn': 'templates',
  tw: 'zh-TW'
};

const normalizeLocales = (locales) => {
  return locales.map((locale) => {
    locale = locale.toLowerCase();
    return localeMap[locale] || locale;
  });
};

let config;

const schema = Joi.object({
  repo: Joi.string().default(''),
  basePath: Joi.string().default(''),
  defaultBranch: Joi.string().default(''),
  includeTasks: Joi.array().items(Joi.string()).default([]),
  excludeTasks: Joi.array().items(Joi.string()).default([]),
  locales: Joi.array().items(Joi.string()).default([]),
  excludeLocales: Joi.array().items(Joi.string()).default([]),
  projects: Joi.object().default({}),
  excludeCkeditor: Joi.bool().optional()
});

const getConfig = (globalOptions, tasks) => {
  if (config) return config;
  let data;
  let path = globalOptions.config;
  if (path) {
    data = yaml.parse(fs.readFileSync(path, { encoding: 'utf-8'} ));
  } else {
    path = Path.join(os.homedir(), '.ut.yaml');
    if (fs.existsSync(path)) {
      data = yaml.parse(fs.readFileSync(path, { encoding: 'utf-8' }));
    } else {
      data = require('./default-conf');
      fs.writeFileSync(path, yaml.stringify(data, null, 2) + '\n', { encoding: 'utf-8' });
    }
  }
  const { error, value } = schema.validate(data);
  if (error) {
    console.error(Path.resolve(path) + ': ' + error.message);
    process.exit(1);
  }
  config = value;

  if (globalOptions.onlyTemplate) {
    config.locales.push('templates')
  }
  if (globalOptions.excludeTemplate) {
    config.excludeLocales.push('templates')
  }

  mergeWith(config, globalOptions, (targetValue, srcValue) => {
    if (Array.isArray(targetValue)) {
      let array = srcValue ? targetValue.concat(srcValue) : targetValue
      return [...new Set(array)];
    }
    return srcValue;
  });
  config.locales = normalizeLocales(config.locales);
  config.excludeLocales = normalizeLocales(config.excludeLocales);
  if (tasks && tasks.length > 0) {
    config.includeTasks = [...new Set(config.includeTasks.concat(tasks))];
  }
  config.repo = Path.join(config.repo, 'locales');
  return config;
};

module.exports.getConfig = getConfig;
