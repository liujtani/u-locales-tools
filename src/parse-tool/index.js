const { json, seajs, requirejs, properties, kindeditor, datepicker, ckeditor } = require('./types');
const { parse } = require('./parse');
const { stringify } = require('./stringify');

module.exports.json = json;
module.exports.seajs = seajs;
module.exports.requirejs = requirejs;
module.exports.properties = properties;
module.exports.kindeditor = kindeditor;
module.exports.datepicker = datepicker;
module.exports.ckeditor = ckeditor;

module.exports.parse = parse;
module.exports.stringify = stringify;
