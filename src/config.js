const os = require('os');
const Path = require('path');
const fs = require('fs');
const Joi = require('joi');
const projects = require('./tasks/projects');
const log = require('./utils/log');
const yaml = require('yaml');

let config;

const defaultPath = Path.join(os.homedir(), '.ut.yaml');
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
  includeTasks: Joi.array().items(Joi.string()).default([]),
  excludeTasks: Joi.array().items(Joi.string()).default([]),
  locales: Joi.array().items(Joi.string()).default([]),
  excludeLocales: Joi.array().items(Joi.string()).default([]),
  projects: Joi.object().default({})
});

const getLocales = (locales) => {
  return locales.map((locale) => {
    locale = locale.toLowerCase();
    return localeMap[locale] || locale;
  });
};

const fillConfigProjects = (config) => {
  projects.forEach((project) => {
    const name = project.name;
    if (!name) {
      log.error(`项目配置中没有指定name属性`);
      process.exit(1);
    }
    const info = config.projects[name];
    let branch = config.defaultBranch;
    let path = name;
    if (info && typeof info.branch === 'string') {
      branch = info.branch;
    }
    if (info && typeof info.path === 'string') {
      path = info.path;
    }
    const basePath = Path.join(config.basePath, path, branch);
    config.projects[name] = Object.assign({}, config.projects[name], {
      name,
      path,
      branch,
      basePath
    });
  });
};

const normalize = (options) => {
  const json = yaml.parse(fs.readFileSync(configPath, { encoding: 'utf-8' }));
  const { error, value } = schema.validate(json);
  if (error) {
    console.error(Path.resolve(configPath) + ': ' + error.message);
    process.exit(1);
  }
  config = value;
  config.repoPath = Path.join(config.repo, 'locales');
  if (options.onlyTemplate) {
    config.locales = new Set(['templates'])
  } else {
    const locales = config.locales.concat(options.locales || []);
    config.locales = new Set(getLocales(locales));
    if (options.templates) {
      config.locales.add('templates');
    }
  }
  config.excludeLocales = config.excludeLocales.concat(options.excludeLocales || []);
  config.excludeLocales = new Set(getLocales(config.excludeLocales));
  if (options.excludeTemplates) {
    config.excludeLocales.add('templates');
  }
  config.includeTasks = config.includeTasks.concat(options.includeTasks || []);
  // config.excludeTasks = config.excludeTasks.concat(options.excludeTasks || [])
  fillConfigProjects(config);
  return config;
};

const initConfig = (options) => {
  const path = options.config;
  if (config) return config;
  if (path) {
    configPath = path;
  } else {
    if (!fs.existsSync(defaultPath)) {
      fs.writeFileSync(defaultPath, yaml.stringify(require('./defaultConf'), null, 2) + '\n');
    }
  }
  config = normalize(options);
  return config;
};

module.exports.initConfig = initConfig;
