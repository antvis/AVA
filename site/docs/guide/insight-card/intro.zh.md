---
title: InsightCard 简介
order: 0
---

<embed src='@/docs/common/style.md'></embed>

InsightCard 是一个用图文并茂的卡片形式展示数据洞察结果的 React 组件。

## ✨ 功能特性

`@antv/ava-react` 中透出了 `InsightCard` 组件供用户使用。`InsightCard` 是一个用于可视化展示数据洞察的 React 组件。它结合了 AVA 中 `insight` 模块的核心能力，并提供了两种使用方式：1.传递数据洞察结果进行展示；2. 传递原始数据，在组件内部使用 ava 库的 insight 模块计算洞察并展示。该组件旨在帮助开发人员以一种开箱即用的方式生成和展示数据洞察。

洞察展现的指导性原则可参考 [增强分析白皮书 -- 洞察展现篇](https://www.yuque.com/antv/whitepapers/sqkgczdmvrzzigsv)。

目前支持的洞察类型如下图所示：![洞察类型概览](https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*cPSLRoKPcdYAAAAAAAAAAAAADmJ7AQ/original)

## 📦 安装

```bash
$ npm install @antv/ava-react
```

## 🔨 使用

```js
import React from 'react';

import ReactDOM from 'react-dom';
import { InsightCard } from '@antv/ava-react';
import { getInsights } from '@antv/ava';

const timeSeriesData = [
  { year: '1991', value: 0.3 },
  { year: '1992', value: -0.5 },
  { year: '1993', value: 0.05 },
  { year: '1994', value: -0.2 },
  { year: '1995', value: 0.4 },
  { year: '1996', value: 6 },
  { year: '1997', value: 3 },
  { year: '1998', value: 9 },
  { year: '1999', value: 5 },
]

const trendInsightData = getInsights(timeSeriesData)?.insights[0];

export default () => {
  return <InsightCard  insightInfo={trendInsightData} />;
}
```

## 📖 API 文档

更多用法请移步至 [官网API](../../api/insight-card/api)
