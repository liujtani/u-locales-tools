module.exports = {
  name: 'exam_web',
  groups: [
    {
      src: 'src/lang/:locale.json',
      dst: 'exam_web.json',
      desc: '考试快捷地址',
      omitKeys: [['_name'], ['lang'], ['langCss']]
    }
  ]
};
