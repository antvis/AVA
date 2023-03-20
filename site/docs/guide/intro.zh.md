---
title: AVA 简介
order: 0
redirect_from:
  - /zh/docs/guide
---

<div align="center">
  <img width="200" height="120" src="http://alipay-rmsdeploy-image.cn-hangzhou.alipay.aliyun-inc.com/antfincdn/9LkQDJaV%24%24/logo.svg" alt="AVA logo">
</div>

<div align="center">

<i>智能可视分析框架</i>

</div>

----

<a href="https://ava.antv.antgroup.com"><img src="https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*rXVYRJ0EMDsAAAAAAAAAAAAADmJ7AQ/original" align="left" hspace="10" vspace="6" width="160"></a>


**AVA** (A Visual Analytics) 是为了更简便的可视分析而生的技术框架。 其名称中的第一个 **A** 具有多重涵义：它说明了这是一个出自阿里巴巴集团（*Alibaba*）技术框架，其目标是成为一个自动化（*Automated*）、智能驱动（*AI driven*）、支持增强分析（*Augmented*）的可视分析解决方案。

<br />

AVA 的整体架构如下：

> v3 版本的架构基于 v2 进行了改良，之前的许多个包被整合成了一个 @antv/ava。所有原先的核心 API 都被保留在其中了，并且在保持原有灵活性的基础上简化了用法。新框架还单独提供了 React 组件库 @antv/react，其中提供了可以直接使用新的解读文本模块 NTV 的组件。

<div align="center">
<img src='https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*jfG3TqYY8PYAAAAAAAAAAAAADmJ7AQ/original' width="100%" alt='AVA framework' />
</div>

<br />

## 演示案例

```html
<div id="mountNode"></div>
```

```js
import { AutoChart } from '@antv/auto-chart';

const data = [
  {field1: 'a', field2: '100'},
  {field1: 'b', field2: '300'},
  {field1: 'c', field2: '800'},
];

ReactDOM.render(
  <>
    <AutoChart 
      title="CASE 1" 
      description="auto chart analysis" 
      data={data} 
      language={'zh-CN'} 
    />
  </>,
  mountNode,
);
```

<br>

<!-- <Playground path="components/auto-chart/demo/basic.jsx"></playground> -->
<!-- FIXME: 关联 insightcard 一类的 demo -->


## [@antv/ava](https://www.npmjs.com/package/@antv/ava)

AVA 的核心 JS 包是`@antv/ava`。以下介绍其主要模块。

### advisor (图表推荐和自动生成)

> 原 ChartAdvisor 包 `@antv/chart-advisor`

`advisor` 是 AVA 的核心部分。它是你的图表建议官，基于数据和分析需求来推荐图表类型和具体的图表细节设置，也可以对既有的图表进行图表优化。

它的核心方法包括：

```js
Advisor.advise() // 图表推荐
Advisor.lint() // 图表优化
```

基本用法举例：

```js
import { Advisor } from '@antv/ava';

const myAdvisor = new Advisor();

// 图表推荐
const data = [{ tax: 100, tag: 'A' }, { tax: 200, tag: 'B' }];
const results = myAdvisor.advise({ data });

// 图表优化
const spec = { someAntVSpec }; // 查看 G2 v5 的图表描述 Specification
const errors = myAdvisor.lint({ spec });
```

### ckb (图表知识库)

> 原 CKB 包 `@antv/ckb`、`@antv/knowledge`

CKB 的意思是 Chart Knowledge Base，也就是图表知识库。`ckb` 这个模块中包含了基于经验总结的关于可视化和图表的各种基本知识和观察。图表的推荐必须基于这些基本概念。

同时，这个模块提供的能力也让开发图表类型筛选相关的产品变得非常简单。

基本用法举例：

```js
import { ckb } from '@antv/ava';

const myCkb = ckb();
// 然后可以按需读取 myCkb 中的结构
```

### data (数据处理)

> 原 DataWizard 包 `@antv/data-wizard`

`data` 模块负责 AVA 框架中的数据集统计分析和处理。同时，它也可以独立地被用来开发一些数据处理、数学统计之类的功能。

它的核心方法包括：

```js
DataFrame.info()
```

基本用法举例：

```js
import { DataFrame } from '@antv/ava';

const df = new DataFrame([{ a: 1, b: 4 }, { a: 2, b: 5 }]);
const infos = df.info();
// infos 的结构将包含数据集的各种统计信息
```

### insight (智能洞察)

> 原 LiteInsight 包 `@antv/lite-insight`

`insight` 模块用于从多维数据中自动地发现数据洞察。

它的核心方法包括：

```js
getInsights()
```

基本用法举例：

```js
import { getInsights } from '@antv/ava';

const data = [{ tax: 100, tag: 'A' }, { tax: 200, tag: 'B' }];
const insights = getInsights(data);
```

## [@antv/ava-react](https://www.npmjs.com/package/@antv/ava-react)

`@antv/ava-react` 是基于 AVA 能力整合而成的即插即用的 React 组件库。

### \<AutoChart /\>

AutoChart 是一个可以根据数据自动推荐合适的图表并渲染的 React 组件。它可以为用户提供一行代码实现智能可视化的能力。

> AutoChart 组件进一步升级中，期待后续版本。

### \<NarrativeTextVis /\>

`ntv` 模块用来展示数据洞察解读文本。包含 `@antv/ava` 中的 `NtvTypes` 相关 spec 声明，以及 `@antv/ava-react` 中一个 react 组件 `NarrativeTextVis`。

基本用法举例：

```jsx
import { NarrativeTextVis } from '@antv/ava-react';

export default () => {
  // 其中 textSpec 类型为 NarrativeTextSpec
  return <NarrativeTextVis spec={textSpec} />
}
```
