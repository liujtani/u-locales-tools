const prettier = require('prettier');
exports.format = (str) =>
  prettier.format(str, { singleQuote: true, quoteProps: 'as-needed', trailingComma: 'none', bracketSpacing: true, proseWrap: 'never', endOfLine: 'crlf', parser: 'babel', printWidth: Infinity });
