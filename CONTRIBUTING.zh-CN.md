<img src="https://gw.alipayobjects.com/zos/antfincdn/R8sN%24GNdh6/language.svg" width="18"> [English](./CONTRIBUTING.md) | 简体中文

# 贡献指南

诚邀您点击右上角 ⭐ Star，关注本项目，以便及时获取最新信息，更好地参与共建。感谢您的支持！

有任何疑问，欢迎提交 [issue](https://github.com/antvis/AVA/issues)，
或者直接修改提交 [PR](https://github.com/antvis/AVA/pulls)!

## 致 非开发者

无论您是设计师、产品经理或普通用户，均可为我们的图表知识库贡献一份力量！**我们非常珍视您的加入，期盼与您携手共建**。

如您尚未拥有 GitHub 账号，建议您先 [申请一个](https://github.com/join)。这一步骤非常值得。

接下来，你可以通过提交 [issue](https://github.com/antvis/AVA/issues) 或 [pull request](https://github.com/antvis/AVA/pulls) 的方式来提供你的建议。

### 提交 Issue

GitHub 的 issues 类似于评论区，您可以在此处留下有关想法、建议、需求等方面的反馈。此外，您还可以在此发现并报告仓库中的 bug。以下是提交 issues 的基本步骤：

1.  新建 issue：切换到 issues 界面，点击右侧 New issue 按钮，在 [issue 标签页](https://github.com/antvis/AVA/issues) 新建一个 issue。

    <div align="center">
      <img src="https://gw.alipayobjects.com/zos/antfincdn/6maXNcnO8T/issue.png" width="600" alt="new issue"/>
    </div>
    <br>

2. 编辑及提交 issue：您无需编写任何代码，只需简要说明您的建议，我们将与您进行讨论并提出反馈。如果您的建议被采纳，我们会负责相应的代码修改。针对某一个具体的问题，只需提交一个 issue 即可。以下是一些 issues 示例：

    * 修改一个已有图表的知识内容？
    * 新增一个图表类型？
    * 修改图表知识的分类角度的可选值？

    <br>
    <div align="center">
      <img src="https://gw.alipayobjects.com/zos/antfincdn/gRt9ryUqUc/newissue.png" width="600" alt="eidt and submit issue"/>
    </div>
    <br>

### 提交 Pull Request

如果您具备编写代码的能力，或者对学习一些代码并不感到抵触，同时又希望将自己的建议以代码的形式清晰地表达出来（或者您希望帮助我们节省时间），那就太棒了！请尝试提交一个 pull request ，这将有助于我们更快地处理您的建议并快速落实到项目中。

如果您还不了解什么是 pull request，请参考：[什么是 pull request](https://help.github.com/cn/github/collaborating-with-issues-and-pull-requests/about-pull-requests).
 
## 致 开发者

### 语言

* 源码和注释中的内容必须使用英语。
* 所有的 issue 和 PR 中描述语言推荐使用英语，部分情况下为描述准确性也可以选择使用中文。

我们优先使用英语，是为了服务更广泛的开发者、深化国际化合作共建，也为了避免不同语言间重复提交问题。

### 提交 issue

* 请确定 issue 的类型。
* 请避免提交重复的 issue，在提交之前搜索现有的 issues。
* 在**标签**(分类参考**标签分类**), **标题**或者**内容**中体现明确的意图。

随后 AntV 负责人会确认 issue 意图，更新合适的标签，关联 milestone，并指派开发者来跟进处理。

### 提交代码

#### 提交 Pull Request

如果您拥有仓库的开发者权限，并希望向项目中贡献代码，那么您可以创建分支并修改代码，随后提交 pull request。AntV 开发团队会对您提交的代码进行 review，并将其合并到主干分支中。

```bash
# 先创建开发分支开发，分支名应该有含义，避免使用 update、tmp 等
$ git checkout -b branch-name

# 开发完成后跑下测试是否通过，必要时需要新增或修改测试用例
$ npm test

# 测试通过后，提交代码，其 commit message 的规范如下
$ git add . # git add -u 删除文件
$ git commit -m "fix(role): role.use must xxx"
$ git push origin branch-name
```

提交后即可在 [AVA](https://github.com/antvis/AVA/pulls) 创建 Pull Request 了。

为了便于后期回溯历史记录，请在提交 MR（merge request）时务必提供以下信息：

1. 需求点（一般关联 issue 或者注释都算）
2. 升级原因（不同于 issue，可以简要描述下为什么要处理）
3. 框架测试点（可以关联到测试文件，不用详细描述，关键点即可）
4. 关注点（针对用户而言，可以没有，一般是不兼容更新等，需要额外提示）

#### 代码风格

您的的代码风格必须通过 eslint，可以运行 `$ npm run lint` 进行本地测试。

#### Commit 提交规范

我们建议遵循 [angular 规范](https://github.com/angular/angular.js/blob/master/CONTRIBUTING.md#commit-message-format) 来提交 commit。这样能够使历史记录更加清晰易懂，并且还可以方便地自动生成 changelog。

```xml
<type>(<scope>): <subject>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```

（1）type

提交 commit 的类型，包括以下几种

* feat: 新功能
* fix: 修复问题
* docs: 修改文档
* style: 修改代码格式，不影响代码逻辑
* refactor: 重构代码，理论上不影响现有功能
* perf: 提升性能
* test: 增加修改测试用例
* chore: 修改工具相关（包括但不限于文档、代码生成等）
* deps: 升级依赖

（2）scope

修改文件的范围

（3）subject

用一句话清楚的描述这次提交做了什么

（4）body

补充 subject，适当增加原因、目的等相关因素，也可不写。

（5）footer

* **当有非兼容修改(Breaking Change)时必须在这里描述清楚**
* 关联相关 issue，如 `Closes #1, Closes #2, #3`

示例

```git
fix($compile): [BREAKING_CHANGE] couple of unit tests for IE9

Older IEs serialize html uppercased, but IE9 does not...
Would be better to expect case insensitive, unfortunately jasmine does
not allow to user regexps for throw expectations.

Document change on antvis/AVA#123

Closes #392

BREAKING CHANGE:

  Breaks foo.bar api, foo.baz should be used instead
```

查看具体[文档](https://docs.google.com/document/d/1QrDFcIiPjSLDn3EL15IJygNPiHORgU1_OOAqWjiDU5Y/edit)

### 发布管理

AVA 基于 [semver] 语义化版本号进行发布。

`master` 分支为当前稳定发布的版本。

* 直接从 `master` 切出开发分支
* 所有 API 的废弃都需要在当前的稳定版本上 `deprecate` 提示，并保证在当前的稳定版本上一直兼容到新版本的发布。

#### 发布策略

每个大版本都有一个发布经理管理（PM），他/她要做的事情

##### 准备工作

* 建立 milestone，确认需求关联 milestone，指派和更新 issues。

##### 发布前

* 确认当前 Milestone 所有的 issue 都已关闭或可延期，完成性能测试。
* 发起一个新的 [Release Proposal MR]，按照 [node CHANGELOG] 进行 `History` 的编写，修正文档中与版本相关的内容，commits 可以自动生成。`$ npm run commits`
* 指定下一个大版本的 PM。

##### 发布时

* 将老的稳定版本（master）备份到以当前大版本为名字的分支上（例如 `1.x`），并设置 tag 为 {v}.x`（ v 为当前版本，例如 `1.x`）。
* 发布新的稳定版本到 [npm]，并通知上层框架进行更新。
* `npm publish` 之前，请先阅读[『我是如何发布一个 npm 包的』]。


[semver]: http://semver.org/lang/zh-CN/
[Release proposal MR]: https://github.com/nodejs/node/pull/4181
[node CHANGELOG]: https://github.com/nodejs/node/blob/master/CHANGELOG.md
[npm]: http://npmjs.com/
[『我是如何发布一个 npm 包的』]: https://fengmk2.com/blog/2016/how-i-publish-a-npm-package
