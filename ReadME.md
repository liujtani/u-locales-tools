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
ut store # 将 本地项目 的翻译资源转换存储到上游仓库，默认仅转换中文
ut store --no-only-template # 去掉默认仅转换中文的限制
ut store course_web # 仅转换course_web 项目
ut store cw # 支持配置别名
ut store um1 um2 # 仅转换 ulearning_mobile_1.0 和 ulearning_mobile_2.0 项目
ut sotre -n um1 um2 # --dry-run 仅转换，不写入到文件中
ut sotre um1 -l # --list 列出要转换的文件列表

# apply
ut apply # 将 上游仓库 的翻译资源转换应用到本地，同时补全翻译
ut apply --no-fill # 不进行补全
ut apply cw # 指定任务

# 指定语言
ut store -o zh tw # 仅转换简体中文和繁体中文
ut store -u zh # 排除简体中文
```

**关于 locales 参数**： locales 参数以上游仓库下的 locales 目录为准，作为特例，可以使用 `zh` 或 `zh-cn` 指代 `templates`，使用 `tw` 指代 `zh-TW`

## 添加自定义项目

```js
module.exports = {
  name: 'activity1', // 项目名称，方便定位项目
  groups: [ // 一个项目可能具有多组不同的语言配置，例如，course_web 项目下的 nls/ 目录下的语言资源和 screen 子项目的语言资源
    {
      type: 'json', // 项目语言资源的文本格式，如果指定，从扩展名中取得
      src: '', // 语言资源的相对路径，src 必须指定 locale，语法和 vue-router 的路由路径语法是一致的
      dst: '', // 对应仓库里的资源文件的相对路径
      localeMap: {
      templates: 'ch'
      desc: 'desc - {filename}'
    }
  ]
};

// src 是本地项目里的国际化文本资源
// dst 是上游仓库里的国际化文本资源
// 由 src 可以计算得出 dst，反之，也可以由 dst 计算得出 src。它们用了 path-to-regexp 这个库，和 vue-router 的路由语法是一致的。
// dst 可以省略 :locale，如果省略，则自动添加 :locale/ 前缀
// 以上面的文件为例，对于待转换的文件：trunk/src/assets/language/ch.json，将其转换为：templates/小组作业ch.json
```

## 配置

`~/.ut.yaml`

```yaml
repo: "", # 上游仓库路径,
baesPath: "", # 本地项目基础路径
defaultBranch: "", # 默认分支，
projects: {
  course_web: {
    path: '', # 项目路径
    alias: 'cw', # 别名
    branch: '' # 覆盖默认分支
  }
} # 项目具体配置
# 一个项目的最终路径，由 basePath + path(如果没有指定，则使用项目的名称) + branch(如果没有指定，则使用defaultBranch)
excludeLocales: ['pt', 'ru'] # 排除的语言
excludeTasks: ['smartClassroom'] # 排除的项目
```
