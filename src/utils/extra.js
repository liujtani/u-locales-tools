const getCommonPath = (files) => {
  if (files.length <= 0) {
    return '/';
  }
  let commonSeps = files[0].split(/\\|\//).filter((it) => it);
  for (let i = 1; i < files.length; i++) {
    const file = files[i];
    const seps = file.split(/\\|\//).filter((it) => it);
    const hub = [];
    for (let j = 0; j < commonSeps.length; j++) {
      const sep = commonSeps[j];
      if (sep === seps[j]) {
        hub.push(sep);
      } else {
        break;
      }
    }
    commonSeps = hub;
    if (commonSeps.length === 0) {
      return '/';
    }
  }
  return commonSeps.join('/');
};

const globReg = /[*?!+@]|\[[\s\S]*\]/;

const getGlobBase = (glob) => {
  const paths = glob.split('/');
  let index = 0;
  for (let i = 0; i < paths.length; i++) {
    const path = paths[i];
    index = i;
    if (globReg.test(path)) {
      break;
    }
  }
  return paths.slice(0, index).join('/');
};

const getGlobsBase = (globs) => {
  return Array.isArray(globs) ? getCommonPath([...new Set(globs.map((glob) => getGlobBase(glob)))]) : getGlobBase(globs);
};

const containsChinese = (str) => {
  return /[\u4e00-\u9fa5]/.test(str)
}

module.exports.getCommonPath = getCommonPath;
module.exports.getGlobBase = getGlobBase;
module.exports.getGlobsBase = getGlobsBase;
module.exports.containsChinese = containsChinese
