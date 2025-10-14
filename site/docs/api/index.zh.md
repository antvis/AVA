---
title: AVA 简介
order: 0
redirect_from:
  - /zh/docs/api
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

> todo: 介绍 v4 的架构

<div align="center">
<img src='https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*ZINwQ6ubADQAAAAAAAAAAAAADmJ7AQ/original' width="100%" alt='AVA framework' />
</div>

<br />

## 演示案例

```html
<div id="mountNode"></div>
```

```js
// todo: 演示案例需要重写

ReactDOM.render(
  <>
    <InsightCard insightInfo={firstInsight} visualizationOptions={{ lang: 'zh-CN' }} />
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

`advisor` 是 AVA 的核心部分。它是你的图表建议官，基于数据和分析需求来推荐图表类型和具体的图表细节设置，也可以对既有的图表进行图表优化。

它的核心方法包括：

```js
Advisor.advise() // 图表推荐
```

基本用法举例：

```js
import { Advisor } from '@antv/ava';

const myAdvisor = new Advisor();

// 图表推荐
const data = [{ tax: 100, tag: 'A' }, { tax: 200, tag: 'B' }];
const results = myAdvisor.advise({ data });

```

