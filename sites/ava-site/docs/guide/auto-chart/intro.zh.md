---
title: AutoChart 简介
order: 0
---

`markdown:docs/common/style.md`


AutoChart 是一个可以根据数据自动推荐合适的图表并渲染的 React 组件。

## ✨ 功能特性

AutoChart 中透出了 `AutoChart` 组件供用户使用。
它结合了 AVA 中的图表推荐库 `ChartAdvisor` 的核心能力。

AutoChart 可以到做到基于给定数据和分析需求来自动生成并渲染合适的图表，
我们推出 AutoChart 的核心目的就是为用户提供一行代码实现智能可视化的能力。


## 📦 安装

```bash
$ npm install @antv/auto-chart
```

## 🔨 使用


```js
import { AutoChart } from '@antv/auto-chart';

const defaultData = [
  { price: 100, type: 'A' },
  { price: 120, type: 'B' },
  { price: 150, type: 'C' },
];

ReactDOM.render(
  <>
    <AutoChart 
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

<playground path="components/auto-chart/demo/basic.jsx"></playground>

## 📖 文档

更多用法请移步至 [官网API](https://ava.antv.vision/zh/docs/api/auto-chart/AutoChart)
