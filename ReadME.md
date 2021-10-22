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

配置文件路径：`~/.ut.yaml`

## 背景

所有项目的翻译都放在协作平台，供翻译员翻译。我们称放在本地项目里的翻译为“本地翻译”，上游平台里翻译为“上游翻译”。

上游翻译协作平台使用 github 仓库存储翻译资源文件，支持 json、properties 等格式的文件。对于 json 文件，它使用如下的格式：

```json
{
  "key": {
    "message": "文本",
    "description": "描述"
  }
}
```

而且，不支持嵌套，比如：

```json
{
  "scope": {
    "key": {
      "message": "文本",
      "description": "描述"
    }
  }
}
```

这种格式是不支持的。协作平台仅支持扁平化的 json 文件，不支持嵌套。

但在本地项目里使用的翻译资源一般都是简单的 **key - value** 对应，而且到处使用嵌套。一些项目还会使用 js 做翻译资源文件。手工转换起来非常麻烦。

这个工具可以帮助我们自动将上游翻译资源转换到本地项目中。

## 使用

**准备工作**

首先 clone 上游协作平台的 github 仓库。

```bash
git clone repo
```

然后，在 `~/.ut.yaml` 中将 `repo` 属性设置为仓库的路径。

```yaml
repo: <repo_path> # 路径可以时相对路径，相对于程序运行时的路径。强烈建议设置为绝对路径，不受程序运行路径的影响
```

最后，再配置本地项目的路径。

```yaml
basePath: '所有项目的公共路径' # 在计算本地翻译资源文件的路径是，会预加这个路径
defaultBranch: 'bugfix'
projects: { course_web: { alias: 'cw', branch: 'trunk', path: 'course_web2' } }
```

以上面的配置为例，我们计算出 `course_web` 的路径为：

```
${basePath}/${projectName || path}/${branch || defaultBranch}
所有项目的公共路径/course_web2/trunk
```

如果没有指定 `path`，那么就使用项目的名称，在这里是 `course_web`，它也是 `projects` 的属性。

### 列出管理的项目

```bash
ut list
```

如果需要排除某个项目，可以将这个项目添加到 `~/.ut.yaml` 的 `excludeTasks` 数组中

### 公共选项

```bash
ut help
```

语言相关：

- `-o --locales <locales...>` 指定要转换的语言
- `-e --exclude-locales <locales...>` 排除要转换的语言
- `-b --only-template` 仅转换中文
- `-u --exclude-template` 排除中文

**关于 locales 参数**： locales 参数以上游仓库里的 locales 目录为准，作为特例，可以使用 `zh` 或 `zh-cn` 指代 `templates`，使用 `tw` 指代 `zh-TW`

控制运行行为：

- `-l --list` 列出要转换的文件
- `-n --dry-run` 执行转换，但不写入到文件中。你可以用这个选项，测试转换是否正常工作

**强烈建议，转换文件前先进行提交，以免程序崩溃或者错误，覆盖修改过的文件，造成数据丢失**

### 本地 -> 上游

本地向上游转换时，仅转换中文。一是因为，我们不负责其它翻译资源文件的翻译，修改它们不合适。二是当协作平台从 github 拉取更新时，很容易造成中途，导致无法读取新的更新。

所以强烈建议不要转换除中文翻译外的文件，除非你的确需要这么做。

```bash
ut store # 转换所有项目，不想转换的项目请在配置文件的 excludeTasks 数组中排除

ut store cw # 仅转换 course_web 项目，cw 是 course_web 的别名
ut store course_web # 指定全名也是可以的

ut store cw us ... # 指定多个项目

ut -X store ... # 取消仅转换中文的限制，同时转换其它翻译的文件
ut -l store cw # 列出 course_web 要转换的文件
ut -n store cw # 仅进行转换，但不写入到文件中
```

### 上游 -> 本地

当上游向本地转换时，会以本地的中文翻译文件为模板，补全缺失的字段和删除多余的字段。例如：

本地中文翻译文件：

```json
{
  "confirm": "确认",
  "cancel": "取消"
}
```

本地英文翻译文件：

```json
{
  "confirm": "OK",
  "close": "clonse"
}
```

经过转换后，英文翻译文件为：

```json
{
  "confirm": "确认",
  "cancel": "取消"
}
```

英文文件没有 `cancel` 属性，所有需要补全，多了 `close` 属性，所以需要删除。

转换过程中，程序会将中文翻译文件特殊对待，**默认不会添加新字段到本地中文翻译文件中**，这是有原因的，因为上游中文翻译文件可能包含其它分支的翻译，如果添加新的字段，可能会导致其它分支的翻译泄漏到本分支中。

上游中文翻译文件：

```json
{
  "confirm": "确定",
  "close": "关闭",
  "cancel": "取消"
}
```

本地中文翻译文件

```json
{
  "confirm": "确认",
  "cancel": "取消"
}
```

经过转换后，本地中文翻译文件为：

```json
{
  "confirm": "确定",
  "cancel": "取消"
}
```

`confirm` 被来自上游的中文翻译文件修改了，但是并没有添加新的字段 —— `close`。

总之：上游中文翻译文件会合并字段，但是并不会添加字段。同时，转换后的本地中文翻译文件会充当其它文件的模板，用于补全缺失的字段和删除多余的字段。

```bash
ut apply # 转换所有项目，不想转换的项目请在配置文件的 excludeTasks 数组中排除

ut apply cw # 仅转换 course_web 项目
ut apply course_web us # 仅转换 course_web 和 us 项目

ut apply --no-fill # 不进行补全，默认会以本地中文翻译文件为模板，补全多余的字段
ut apply --append # 对本地中文翻译文件添加新的字段。默认是不添加新的字段的。
# 注意：--apend 也会影响其它文件，因为它影响了本地中文翻译文件，其它语言的翻译文件会以本地翻译文件模板，补全缺失的字段和删除多余的字段
```

还有，可以在选项中排除中文或不指定中文，例如 `--exclude-template`。这样就不会转换本地中文翻译文件，但可能会影响其它语言的翻译文件，因为其它语言的翻译文件会以本地翻译文件模板，补全缺失的字段和删除多余的字段。

### 排错

1. 文件没有转换？
   1. 使用 `-l --list` 可以查看转换的文件列表，查看文件是否转换
   2. 当文件从平台向本地项目转换时，是基于本地项目的中文字符串进行转换的，如果没有对应的中文字符串，那么这个字符串就不会写入到项目文件中
2. 文件转换失败
   1. 文件仅支持 UTF-8 编码，特别是不支持带 BOM 的文本文件。

### ckeditor

ckeditor 所有插件的翻译都会集中到上游的 `ckeditor.json` 文件中。

ckeditor 跨域多个项目，它的一个插件在多个项目中都会引用。例如，simplelink 插件，就包含在 course_web umooc_homework_front 和 uaweb 三个项目中。

对于 **本地 -> 上游** 转换，程序会按照 course_web、umooc_homework_front 和 uaweb 的顺序，依次取项目里的文件进行转换。例如：

```bash
ut store cw # 取 course_web 里的 simple ckeditor 插件翻译文件进行转换
ut store ua cw # 同上，取 course_web
ut store ua # 取 ua，因为没有指定 course_web
```

对于 **上游 -> 本地** 转换，程序会转换写入到所有指定的项目中：

```bash
ut apply cw # 仅转换到 cw
ut apply cw ua
```

应该尽可能地保证，所有项目里用到的 ckeditor 插件翻译文件相同。比如在 course-web 里改了 simplelink 的翻译，也应该将这个翻译同步到 umooc_homework_front 和 uaweb 里。通过下面的命令顺序，可以实现这一点：

```bash
ut store cw
ut apply hw ua # 同步到 umooc_homework_front 和 ua_web
```

## 新增项目

在 `src/projects` 目录下新增一个配置文件，这个配置文件描述了项目的一些信息。比如下面的一个示例：

```js
module.exports = {
  name: 'activity1', // 项目名称，方便定位项目
  // 一个项目可能具有多组不同的语言配置，例如，course_web 项目就包括 common/nls 翻译文件集 和 screen 翻译文件集
  groups: [
    {
      type: 'json', // 项目语言资源的文本格式，如果没有指定，从扩展名中取得
      src: '', // 本地项目里翻译文件的相对路径，src 必须指定 locale，语法和 vue-router 的路由路径语法是一致的
      dst: '', // 上游仓库里的翻译文件的相对路径
      localeMap: {
        templates: 'ch' // 尽量使用标准的语言标记，比如 zh 表示 中文，如果用了不规范的标记，可以在 localeMap 中指定
      }
      desc: 'desc - {filename}' // 
    }
  ]
};

// 由 src 可以计算得出 dst，反之，也可以由 dst 计算得出 src。它们用了 path-to-regexp 这个库，和 vue-router 的路由语法是一致的。
// dst 可以省略 :locale，如果省略，则自动添加 :locale/ 前缀
// 以上面的文件为例，对于待转换的文件：trunk/src/assets/language/ch.json，将其转换为：templates/小组作业ch.json
```
