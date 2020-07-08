# AVA/CKB 代码贡献指南

**诚邀点击右上角 ⭐ Star，关注本项目，获得最新信息，便于参与共建。谢谢您！**

首先请确保你已经浏览过 [通用代码贡献指南](../../../zh-CN/CONTRIBUTING.zh-CN.md)。

请阅读 [用户指南](./USERGUIDE.zh-CN.md) 来了解图表知识库中的对图表类型信息的记录结构和相关概念。

## 致 开发者

### 修改一个已有图表的知识内容

1. 在 [`AVA/packages/knowledge/src/base.ts`](../src/base.ts) 中找到这个具体图表类型，修改其内容。
2. 如果你的修改涉及到图表的名称（name）、别名（alias）、定义（def），请到 [`AVA/packages/knowledge/src/i18n/`](../src/i18n/) 路径下提供各语言版本的相关翻译。
3. 提交 [PR](https://github.com/antvis/AVA/pulls)，或者先开一个 [issue](https://github.com/antvis/AVA/issues) 来和我们讨论。

### 新增一个图表类型

1. 在 [`AVA/packages/knowledge/src/chartID.ts`](../src/chartID.ts) 给你要新增的图表类型定义一个 ID，确保其未被占用。
2. 在 [`AVA/packages/knowledge/src/base.ts`](../src/base.ts) 中加入这个图表类型的知识内容。
3. 在 [`AVA/packages/knowledge/src/i18n/`](../src/i18n/) 路径下提供各语言版本的翻译。
4. 提交 [PR](https://github.com/antvis/AVA/pulls)，或者先开一个 [issue](https://github.com/antvis/AVA/issues) 来和我们讨论。

### 修改图表知识的分类角度的可选值

1. 在 [`AVA/packages/knowledge/src/interface.ts`](../src/interface.ts) 中找到对应角度的 OPTION 数组。
2. 修改其值并提交 [PR](https://github.com/antvis/AVA/pulls)，或者先开一个 [issue](https://github.com/antvis/AVA/issues) 来和我们讨论。

## 致 非开发者

也许你是设计师、产品经理、普通用户，你也可以为我们的图表知识库出一份力！**而且我们真的很需要你！**

如果你还没有 GitHub 账号，先 [申请一个](https://github.com/join)。这很值得。

阅读 [用户指南](./USERGUIDE.zh-CN.md) 来了解图表知识库中的对图表类型信息的记录结构和相关概念。

然后，你可以通过提交 [issue](https://github.com/antvis/AVA/issues) 或 [pull request](https://github.com/antvis/AVA/pulls) 的方式来提供你的建议。

### 提交 Issue

GitHub 的 issues 是一个类似评论区的功能，你可以在这里留下你的想法、建议、发现的 bug，等等。

<div align="center">
  <img src="https://gw.alipayobjects.com/zos/antfincdn/6maXNcnO8T/issue.png" width="600" />
</div>
<br>

在 [issue 标签页](https://github.com/antvis/AVA/issues) 新建一个 issue。

<div align="center">
  <img src="https://gw.alipayobjects.com/zos/antfincdn/gRt9ryUqUc/newissue.png" width="600" />
</div>
<br>


你不需要写任何代码，只需要留下你的建议，我们会回复你并和你讨论。如果你的建议被采用了，我们会负责相关的代码修改。

* 修改一个已有图表的知识内容？
* 新增一个图表类型？
* 修改图表知识的分类角度的可选值？

留一个 issue 就好。

### 提交 Pull Request

如果你会写代码，或者对学一点代码并不感到抵触，同时你希望把你的建议描述地想代码一样清晰（或者你就是想帮我们省点时间），那太好了！试试提交一个 pull request！

[什么是 pull request](https://help.github.com/cn/github/collaborating-with-issues-and-pull-requests/about-pull-requests).
