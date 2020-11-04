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
ut -h # 显示帮助
ut store -h # 显示store子命令的帮助
ut help store # 同上

ut store # 将 本地项目 的翻译资源转换存储到上游仓库
ut store -t # 仅转换中文
ut apply # 将 上游仓库 的翻译资源转换应用到本地
ut apply -m # --complete 应用到本地时，是否同时补全翻译
ut check-t # check-translation 翻译检查
```

## 添加自定义项目

```js
module.exports = {
  name: 'activity1', // 项目名称，方便定位项目
  type: 'json', // 项目的文件类型，可选，如果没有指定，则从扩展名中取得
  localPath: '1.0/src/assets/language/(:locale).json',
  remotePath: '小组作业ch.json',
  localeMap: {
    templates: 'ch'
  },
  desc: 'desc - {filename}' // {} 中的是插值。
};
```

## 配置

`~/.ut.json`

```jsonc
{
  "repo": "", // 上游仓库路径,
  "baesPath": "", // 本地项目基础路径
  "defaultBranch": "", // 默认分支，
  "projects": {} // 项目具体配置
}
```

## todo

- copyToOther
- error handle
