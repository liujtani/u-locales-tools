const Path = require('path');
const fs = require('fs');
const fsp = fs.promises;

const hasLocale = (locale, config) => {
  const { locales, excludeLocales } = config;
  if (excludeLocales.indexOf(locale) > -1) return false;
  if (locales.length > 0 && locales.indexOf(locale) < 0) return false;
  return true;
};

const write = async (path, text) => {
  if (!fs.existsSync(path)) {
    const dirname = Path.dirname(path);
    if (!fs.existsSync(dirname)) {
      await fsp.mkdir(dirname, { recursive: true });
    }
    await fsp.writeFile(path, text);
    return true;
  } else {
    const originalText = await fsp.readFile(path, { encoding: 'utf-8' });
    if (originalText !== text) {
      await fsp.writeFile(path, text);
      return true;
    }
    return false;
  }
};

module.exports.write = write;
module.exports.hasLocale = hasLocale;
