---
title: Chart Advisor 简介
order: 0
---

`markdown:docs/common/style.md`

<div class="doc-md">

基于数据和分析需求来推荐和自动生成图表

</div>

## 演示案例

```html
<div id="mountNode"></div>
```

```js
import { autoChart } from '@antv/chart-advisor';

const container = document.getElementById('mountNode');

const data = [
  {field1: 'a', field2: '100'},
  {field1: 'b', field2: '300'},
  {field1: 'c', field2: '800'},
];

autoChart(container, data, {toolbar: true, development: true});
```

## 特性

### 图表推荐

通过分析给定的数据集和分析需求，推荐出一个图表配置列表。位于列表首位的是推荐值最高的图表配置。

### 图表生成

根据图表配置，自动生成和渲染图表到指定的容器中。

## 安装

```bash
$ npm install @antv/chart-advisor
```

## 使用

```js
import { autoChart } from '@antv/chart-advisor';

autoChart(container, data, {toolbar: true, development: true});
```

</div>
