---
title: InsightCard 简介
order: 0
---

<embed src='@/docs/common/style.md'></embed>

InsightCard 是一个用图文并茂的卡片形式展示数据洞察结果的 React 组件。

## ✨ 功能特性

`@antv/ava-react` 中透出了 `InsightCard` 组件供用户使用。
// todo + 白皮书链接
它结合了 AVA 中的图表推荐库 `ChartAdvisor` 的核心能力。

AutoChart 可以到做到基于给定数据和分析需求来自动生成并渲染合适的图表，
我们推出 AutoChart 的核心目的就是为用户提供一行代码实现智能可视化的能力。


## 📦 安装

```bash
$ npm install @antv/ava-react
```

## 🔨 使用


```js
import { InsightCard } from '@antv/auto-chart';

const defaultData = [
  { price: 100, type: 'A' },
  { price: 120, type: 'B' },
  { price: 150, type: 'C' },
];

ReactDOM.render(
  <>
    <InsightCard
      title="CASE 1" 
      description="auto chart analysis" 
      data={defaultData} 
      language={'zh-CN'} 
    />
  </>,
  mountNode,
);
```


### AutoChart 演示案例

<Playground path="components/auto-chart/demo/basic.jsx"></playground>

## 📖 文档

更多用法请移步至 [官网API](https://ava.antv.antgroup.com/zh/docs/api/auto-chart/AutoChart)
