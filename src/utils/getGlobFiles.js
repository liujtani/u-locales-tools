const glob = require('glob');

module.exports.getGlobFiles = (globPath) => {
  return new Promise((resolve, reject) => {
    glob(globPath, (err, matches) => {
      if (err) {
        reject(err);
      } else {
        resolve(matches);
      }
    });
  });
};
