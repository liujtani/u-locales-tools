const Path = require('path');
const { parse } = require('dot-properties');
const fs = require('fs');
const fsp = fs.promises;
const umoocView = require('../projects/umooc-view');
const { walk } = require('../utils/extra');
const { properties } = require('../parse-tool/types');
const { getBasePath, match } = require('../utils/ptr');
const { getProjectPath } = require('../utils/repo');

module.exports.checkProperties = async (config, options) => {
  const { output } = options;
  const group = umoocView.groups.find((it) => it.name === 'properties');
  const basePath = getProjectPath(config, 'umooc-view');
  const path = Path.join(basePath, getBasePath(group.src.replace(/\\/g, '/')));
  const files = [];
  const matchFn = match(group.src);
  await walk(path, (file) => {
    if (matchFn(file.replace(/\\/g, '/'))) {
      files.push(file);
    }
  });

  const map = {};
  await Promise.all(
    files.map(async (file) => {
      const obj = parse(await fsp.readFile(file, { encoding: 'utf-8' }), properties);
      Object.keys(obj).forEach((key) => {
        if (obj[key].includes("'") || obj[key].includes('"')) {
          const item = {
            value: obj[key],
            path: file
          };
          if (map[key]) {
            map[key].push(item);
          } else [(map[key] = [item])];
          if (obj[key].includes("'") && obj[key].includes('"')) {
            item.error = '错误：单引号和双引号不可同时出现';
          }
        }
      });
    })
  );
  const list = [];
  const jspFiles = [];
  await walk(basePath, (file) => {
    if (Path.extname(file) === '.jsp') {
      jspFiles.push(file);
    }
  });
  await Promise.all(
    jspFiles.map(async (file) => {
      const text = await fsp.readFile(file, { encoding: 'utf-8' });
      const scriptReg = /<script[\s\S]*?>([\s\S]*?)<\/script>/gi;
      let match = null;
      const set = new Set();
      while ((match = scriptReg.exec(text))) {
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
            console.warn('warn：key错误', b, file);
            continue;
          }
          if (set.has(key)) {
            continue;
          }
          set.add(key);
          const values = map[key];
          if (values) {
            list.push(...values);
          }
        }
      }
    })
  );
  if (!output) {
    console.log(JSON.stringify(list, null, 2) + '\n');
  } else {
    const dirname = Path.dirname(output);
    await fsp.mkdir(dirname, { recursive: true });
    await fsp.writeFile(output, JSON.stringify(list, null, 2) + '\n');
  }
};
