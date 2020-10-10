const omit = require('lodash/omit');
const { getRemoteData } = require('../utils/remote');
const Path = require('path')
const fs = require('fs')
const fsp = fs.promises

module.exports.checkChinese = async (output) => {
  const map = await getRemoteData(false)
  const obj = {}
  await Promise.all(Object.keys(omit(map, ['templates', 'zh-TW'])).map(async (locale) => {
   await Promise.all(Object.keys(map[locale]).map(async (file) => {
     const data = map[locale][file]
     const compositeKey = `${locale}/${file}`
     obj[compositeKey] = {}
     Object.keys(data).forEach(key => {
       const text = data[key]
       if (/[\u4e00-\u9fa5]/.test(text)) {
         obj[compositeKey][key] = text
       }
     })
     if (Object.keys(obj[compositeKey]).length === 0) {
       obj[compositeKey] = undefined
     }
   }))
  }));
  await fsp.writeFile(Path.join(output, 'hasChinese.json'), JSON.stringify(obj, null, 2) + '\n')
};
