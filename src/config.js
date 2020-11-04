const os = require('os');
const Path = require('path');
const fs = require('fs');
const Joi = require('joi');

let config;

const defaultPath = Path.join(os.homedir(), '.ut.json');
let configPath = defaultPath;

const localeMap = {
  zh: 'templates',
  'zh-cn': 'templates',
  tw: 'zh-TW'
};

const schema = Joi.object({
  repo: Joi.string().default(''),
  basePath: Joi.string().default(''),
  defaultBranch: Joi.string().default(''),
  includeTasks: Joi.alternatives().conditional(Joi.array(), { then: Joi.array().items(Joi.string()), otherwise: Joi.string().equal('all') }).default('all'),
  excludeTasks: Joi.array().items(Joi.string()).default([]),
  locales: Joi.array().items(Joi.string()),
  excludeLocales: Joi.array().items(Joi.string()),
  projects: Joi.object().default({})
});

const getLocales = (locales) => {
  if (!Array.isArray(locales)) {
    return [];
  }
  return locales.map((locale) => {
    locale = locale.toLowerCase();
    localeMap[locale] || locale;
  });
};

const normalize = (globalOptions, options) => {
  const json = JSON.parse(fs.readFileSync(configPath, { encoding: 'utf-8' }));
  const { error, value } = schema.validate(json);
  if (error) {
    console.error(Path.resolve(configPath) + ': ' + error.message)
    process.exit(1)
  }
  config = value;
  config = Object.assign(config, globalOptions, options);
  config.repoPath = Path.join(config.repo, 'locales');
  config.locales = new Set(getLocales(config.locales));
  if (globalOptions.templates) {
    config.locales.add('zh');
  }
  config.excludeLocales = new Set(getLocales(config.excludeLocales));
  if (globalOptions.excludeTemplates) {
    config.excludeLocales.add('zh');
  }
  return config;
};

const initConfig = (globalOptions, options) => {
  const path = globalOptions.config;
  if (config) return config;
  if (path) {
    configPath = path;
  } else {
    if (!fs.existsSync(defaultPath)) {
      fs.writeFileSync(defaultPath, JSON.stringify(require('./ut'), null, 2) + '\n');
    }
  }
  config = normalize(globalOptions, options);
};

const getConfig = () => config;

module.exports.initConfig = initConfig;
module.exports.getConfig = getConfig;
