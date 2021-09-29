module.exports = {
  name: 'discussion2',
  groups: [
    {
      src: 'src/locales/:locale.json',
      dst: 'discussion2.json',
      desc: '新版讨论',
      omitKeys: [['_name'], ['langCss']]
    }
  ]
};
