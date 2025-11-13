---
title: Custom Render
order: 3
redirect_from:
  - /zh/docs/api/render
---

## GPT-Vis Component Library On-Demand Rendering

Users can load components on-demand based on the chart types they use to reduce bundle size. The following example demonstrates how to implement on-demand rendering with GPT-Vis.


```js
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Advisor, bindRenderer } from '@antv/ava';
import { Line, Area, Bar, Pie } from '@antv/gpt-vis';

const demandRender = (container, spec) => {
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
    message.error(`Unsupported chart type: ${chartType}`);
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

## Rendering with GPTVis Protocol

GPTVis protocol Markdown renderer is based on Markdown syntax extension with vis-chart code blocks and supports custom rendering components.

### Basic Usage
```js
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Advisor, bindRenderer } from '@antv/ava';
import { GPTVis } from '@antv/gpt-vis';

const gptVisRenderer = (container, spec) => {
  const mount = document.querySelector(container);
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


### On-Demand Usage

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

## GPT-Vis Server-Side Rendering (SSR)
GPT-Vis also supports chart rendering on the server side. The following example demonstrates how to use `@antv/gpt-vis-ssr` for SSR rendering in a Node.js environment.

```js
import { render } from '@antv/gpt-vis-ssr';
import { Advisor, bindRenderer } from '@antv/ava';

const gptVisSSRRenderer = async (container, spec) => {
  const chart = await render(spec);
  // Export
  chart.exportToFile('chart');
  // -> chart.png
  chart.toBuffer();
  // -> get buffer
};

```
A visualization chart will be generated in approximately 400ms as shown below, which is almost identical to rendering in the browser.

<img src="https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*XqCnTbkpAkQAAAAAAAAAAAAADmJ7AQ/fmt.webp" alt="gpt-vis-ssr" width="600" />

