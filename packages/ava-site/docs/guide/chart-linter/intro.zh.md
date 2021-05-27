---
title: Chart Linter 简介
order: 0
---

`markdown:docs/common/style.md`

<div class="doc-md">

根据图表类型、图表配置和规则库，识别图表设计中存在的问题。

## 演示案例

<playground path="chart-linter/linter/demo/g2plot.jsx"></playground>

## Chart Linter 流程
Chart Linter 有两个重要模块，一个是 Linter，另一个是 Fixer。从图表上识别问题所在，是 Linter 的职责，而修复这些问题，则是 Fixer 的工作。无论你用的是何种前端图表库，只要将图表类型和配置项交给 Chart Linter 就好，接下来它会通过 Adaptor（目前已支持 G2Plot） 将图表配置转义为我们特殊定制的图表通用编码 Specification。Specification 在整个流程中的作用，就像是普通话，是一种通用的“语言”。Linter 能够识别 Specification 结构，并通过既定 Rules 验证当前结构是否符合规则。如果存在不符合规则的部分，则会将规则 ID 暴露出来。每个规则 ID 都对应一条优化建议。接下来，你可以根据自己上层应用的需求，定制 Fixer，以决定如何处理这条规则。

<img src="https://gw.alipayobjects.com/zos/antfincdn/WqlI5blp6I/20210527172309.jpg" alt="pipeline" width="100%"/>

在整个流程中的每个模块，你都可以拆解下来自由替换。在 Fixer 模块，我们没有选择直接帮用户修复图表问题，而是抛出问题 ID 并在社区规则文档中给出思路，解法将由你自己定义。这样的做法，是考虑到上层应用方式和图表库类型各有不同，每种图表库都可以有自己的修复方案。

值得注意的是，Rules 包含硬约束（Hard Rules）和软约束（Soft Rules）两种类型的规则。硬约束是同济学术方案默认提供的规则，也是学术界当下公认的基本规范（基于 Draco），而我们提供了软约束支持用户自定义，支持用户自由扩展。目前，我们已经支持了笛卡尔坐标系下的常见图表类型。如果你现在就想在极坐标系或者其他特殊坐标系的图表中使用 Chart Linter 方案，可以通过 rule-base 的方式根据图表库特性额外编写规则。例如，在我们的业务图表库中有这样一条规则，饼图的切片数不建议超过 8 片，但是你也可以根据需要将切片数量的限制改为 10。之后，你也可以增加更多的你喜欢的规则。

## 安装

```bash
$ npm install @antv/chart-linter
```

</div>
