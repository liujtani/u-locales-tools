const option = require('../loaders/view-properties');

const { Config } = require('../config/index');
const { getGlobFiles } = require('../utils/getGlobFiles');
const { parse } = require('../utils/properties');
const fs = require('fs');
const fsp = fs.promises;

const config = new Config(option);

module.exports.checkProperties = async () => {
  const map = new Map();
  const files = await getGlobFiles(config.localGlob);
  await Promise.all(
    files.map(async (file) => {
      const match = config.localRegex.exec(file);
      const locale = match.groups.locale;
      const obj = parse(await fsp.readFile(file, { encoding: 'utf-8' }));
      Object.keys(obj).forEach((field) => {
        const value = obj[field];
        if (value && (value.includes('"') || value.includes("'"))) {
          const item = map.get(field) || [];
          item.push({
            value: value,
            locale: locale
          });
          map.set(field, item);
        }
      });
    })
  );
  const result = {};
  const jspFiles = await getGlobFiles('../umooc-view/i18n/src/main/webapp/**/*.jsp');
  await Promise.all(
    jspFiles.map(async (file) => {
      const contents = await fsp.readFile(file, { encoding: 'utf-8' });
      const scriptReg = /<script[\s\S]*?>([\s\S]*?)<\/script>/gi;
      let match = null;
      const set = new Set();
      while ((match = scriptReg.exec(contents))) {
        const type = /^<script([\s\S]+?type\s*?=\s*?([\S]+)[\s\S]*?)?>/.exec(match);
        if (type && type[2] && (!type[2].includes('javascript') || !type[2].includes('ecmascript'))) {
          continue;
        }
        const script = match[1] || '';
        const reg = /<bean:message[\s\S]+?key\s*?=\s*?([^\s/]+)/gi;
        let bean;
        while ((bean = reg.exec(script))) {
          const b = bean[1];
          let key = '';
          if (b.length > 1 && b[0] === b[b.length - 1] && b[0] === '"') {
            key = b.slice(1, -1);
          } else if (b.length > 1 && b[0] === b[b.length - 1] && b[0] === "'") {
            key = b.slice(1, -1);
          } else {
            console.warn('warn：key错误', b);
            continue;
          }
          if (set.has(key)) {
            continue;
          }
          set.add(key);
          const values = map.get(key);
          if (values) {
            const items = values.filter(({ value }) => {
              if (value.includes('"') && value.includes("'")) {
                console.warn('warn：单引号和双引号不可同时出现：', key, file);
              } else if (value.includes('"') && !b.startsWith('"')) {
                return true;
              } else if (value.includes("'") && !b.startsWith("'")) {
                return true;
              }
            });
            if (items.length > 0) {
              if (!result[key]) {
                result[key] = [];
              }
              result[key] = [...result[key], ...items.map(({ locale, value }) => ({ value, locale, file }))];
            }
          }
        }
      }
    })
  );
  Object.keys(result).forEach((key) => {
    result[key] = [...result[key]];
  });
  try {
    await fsp.mkdir('./.log')
  } catch (e) {}
  await fsp.writeFile('./.log/properties.json', JSON.stringify(result, null, 2));
};
