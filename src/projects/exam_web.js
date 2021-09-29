module.exports = {
  name: 'exam_web',
  groups: [
    {
      src: 'src/lang/:locale.json',
      dst: 'exam_web.json',
      desc: '',
      omitKeys: [['_name'], ['lang'], ['langCss']]
    }
  ]
};
