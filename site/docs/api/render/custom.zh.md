---
title: 自定义渲染器
order: 3
redirect_from:
  - /zh/docs/api/render
---

## GPT-Vis 组件库按需渲染 

用户可以根据使用的图表类型按需加载组件，以减少包体积。以下示例演示了如何使用 GPT-Vis 实现按需渲染功能。

```js
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Advisor, bindRenderer } from '@antv/ava';
import { Line, Area, Bar, Pie } from '@antv/gpt-vis';

const demandRender = (container: string, spec: any) => {
  const { type, ...chartProps } = spec;
  const chartType = type as 'line' | 'area' | 'bar' | 'pie';

  const mount = document.querySelector(container);
  if (!mount) return;

  const VISComps = {
    line: Line,
    area: Area,
    bar: Bar,
    pie: Pie,
  };
  const Comp = VISComps[chartType];

  if (!Comp) {
    message.error(`不支持的图表类型: ${chartType}`);
    throw new Error(`Unknown chart type: ${chartType}`);
  }

  mount.innerHTML = '';
  const chartElement = React.createElement(Comp, chartProps);
  const root = ReactDOM.createRoot(mount);
  root.render(chartElement);
};

const advisor = new Advisor();
const chartSpec = {
  type: 'area',
  data: [
    { time: '2018', value: 91.9 },
    { time: '2019', value: 99.1 },
    { time: '2020', value: 101.6 },
    { time: '2021', value: 114.4 },
    { time: '2022', value: 121 },
  ],
};

const RenderChart = () => {

  useEffect(() => {
    bindRenderer(demandRender);
    advisor.render('#chart', chartSpec);
  }, []);
 
  return (
    <div id="chart"/>
  );
};

export default RenderChart;
```

## 使用 GPTVis 协议渲染

GPTVis 协议的 Markdown 渲染器，基于 Markdown 语法扩展 vis-chart 语法块，并且支持自定义渲染组件。

### 基础使用
```js
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Advisor, bindRenderer } from '@antv/ava';
import { GPTVis } from '@antv/gpt-vis';

const gptVisRenderer = (container: string, spec: any) => {
  const mount = document.querySelector(container) as HTMLElement;
  if (!mount) return;

  mount.innerHTML = '';

  const content = `## GPT-VIS 
  Components for GPTs, generative AI, and LLM projects. Not only UI Components.
  \`\`\`vis-chart
  ${JSON.stringify(spec)}
  \`\`\``;
  const root = ReactDOM.createRoot(mount);
  root.render(<GPTVis>{content}</GPTVis>);
};

const advisor = new Advisor();
const chartSpec = {
  type: 'area',
  data: [
    { time: '2018', value: 91.9 },
    { time: '2019', value: 99.1 },
    { time: '2020', value: 101.6 },
    { time: '2021', value: 114.4 },
    { time: '2022', value: 121 },
  ],
};

const RenderChart = () => {

  useEffect(() => {
    bindRenderer(gptVisRenderer);
     advisor.render('#chart', chartSpec);
  }, []);
 
  return (
    <div id="chart"/>
  );
};

export default RenderChart;
```


### 按需使用

```js
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Advisor, bindRenderer } from '@antv/ava';
import { GPTVisLite, Pie, withChartCode } from '@antv/gpt-vis';

const components = {
  code: withChartCode({
    components: { [ChartType.Pie]: Pie }, // register a pie chart
  }),
};

const gptVisRenderer = (container: string, spec: any) => {
  const mount = document.querySelector(container) as HTMLElement;
  if (!mount) return;

  mount.innerHTML = '';

  const content = `## GPT-VIS 
  Components for GPTs, generative AI, and LLM projects. Not only UI Components.
  \`\`\`vis-chart
  ${JSON.stringify(spec)}
  \`\`\``;
  
  const root = ReactDOM.createRoot(mount);
  root.render(<GPTVisLite components={components}>{content}</GPTVisLite>);
};

const advisor = new Advisor();
const chartSpec = {
  type: 'area',
  data: [
    { time: '2018', value: 91.9 },
    { time: '2019', value: 99.1 },
    { time: '2020', value: 101.6 },
    { time: '2021', value: 114.4 },
    { time: '2022', value: 121 },
  ],
};

const RenderChart = () => {

  useEffect(() => {
    bindRenderer(gptVisRenderer);
    advisor.render('#chart', chartSpec);
  }, []);
 
  return (
    <div id="chart"/>
  );
};

export default RenderChart;
```

## GPT-Vis 服务端渲染（SSR）
GPT-Vis 也支持在服务端进行图表渲染，以下示例展示了如何在 Node.js 环境下使用 `@antv/gpt-vis-ssr` 进行 SSR 渲染。

```js
import { render } from '@antv/gpt-vis-ssr';
import { Advisor, bindRenderer } from '@antv/ava';

const gptVisSSRRenderer = async (container: string, spec: any) => {
  const chart = await render(spec);
  // 导出
  chart.exportToFile('chart');
  // -> chart.png
  chart.toBuffer();
  // -> get buffer
};

```
大概会在 400ms 左右生成一张可视化图如下，基本和在浏览器端渲染的没有太大区别。

<img src="https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*XqCnTbkpAkQAAAAAAAAAAAAADmJ7AQ/fmt.webp" alt="gpt-vis-ssr" width="600" />


