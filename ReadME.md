## changes

- `ulearning_mobile_1.0` 的路径改变了，去掉了前面的 `1.0` 前缀

## 安装

```bash
git clone https://github.com/liujtani/u-locales-tools
npm i
npm link
```

卸载

```bash
npm unlink
```

## 使用

```bash
# help
ut -h # 显示帮助
ut store -h # 显示store子命令的帮助
ut help store # 同上

ut list # 列出当前可供转换的项目

# store
ut store # 将 本地项目 的翻译资源转换存储到上游仓库
ut store -b # --templates 仅转换中文
ut store -t course_web # 仅转换course_web 项目
ut store -t cw # 支持配置别名
ut store -t um1 um2 # 仅转换 ulearning_mobile_1.0 和 ulearning_mobile_2.0 项目

# apply
ut apply # 将 上游仓库 的翻译资源转换应用到本地，同时补全翻译
ut apply --no-fill # 不进行补全

# ckeditor
ut ckeditor -S # --store
ut ckeditor -A # --apply
ut ckeditor -A --no-fill # 不进行补全
ut ckeditor -S --order uaw hw cw # 默认顺序是 cw hw uaw
# 顺序对于转换的影响
# 对于 --store，取指定项目顺序的第一个项目的文件，进行转换
# 对于 --apply, 合并时，取指定项目顺序的第一个项目的文件，进行合并
```

**关于locales 参数**： locales 参数以语言资源文件所在的仓库下的locales目录为准，作为特例，可以使用`zh`或`zh-cn`指代`templates`，使用`tw`指代`zh-TW`

## 添加自定义项目

```js
module.exports = {
  name: 'activity1', // 项目名称，方便定位项目
  type: 'json', // 项目的文件类型，可选，如果没有指定，则从扩展名中取得
  src: 'trunk/src/assets/language/:locale.json',
  dst: '小组作业ch.json',
  localeMap: {
    templates: 'ch'
  },
  desc: 'desc - {filename}' // {} 中的是插值。
};
```

## 配置

`~/.ut.yaml`

```yaml
repo: "", # 上游仓库路径,
baesPath: "", # 本地项目基础路径
defaultBranch: "", # 默认分支，
projects: {} # 项目具体配置
```

