const prettier = require('prettier');
exports.format = (str) =>
  prettier.format(str, { singleQuote: true, quoteProps: 'as-needed', trailingComma: 'none', bracketSpacing: true, printWidth: 180, endOfLine: 'crlf', parser: 'babel' });
