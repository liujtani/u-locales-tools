const through = require('through2');

module.exports.count = (config, globs) => {
  let count = 0;
  const stream = through.obj(function (file, _, callback) {
    count++;
    callback(null, file);
  });
  stream.on('end', () => {
    if (count === 0) {
      console.warn(config.project, 'glob 对应的文件列表为空，请检查glob ', globs);
    }
  });
  return stream;
};
