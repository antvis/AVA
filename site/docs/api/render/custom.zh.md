---
title: 自定义渲染器
order: 3
redirect_from:
  - /zh/docs/api/render
---

## GPT-Vis 按需渲染
```js
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Advisor, bindRenderer } from '@antv/ava';
import { Line, Area, Bar, Pie } from '@antv/gpt-vis';

const demandRender = (params: any) => {
  const { container, spec } = params || {};
  const { type, ...chartProps } = spec;
  const chartType = type as 'line' | 'area' | 'bar' | 'pie';
  const mount =
    typeof container === 'string' ? (document.querySelector(container) as HTMLElement) : (container as HTMLElement);
  if (!mount) return;
  const VISComps = {
    line: Line,
    area: Area,
    bar: Bar,
    pie: Pie,
  };
  const Comp = VISComps[chartType] as React.ComponentType<any>;

  if (!Comp) {
    message.error(`不支持的图表类型: ${chartType}`);
    throw new Error(`Unknown chart type: ${chartType}`);
  }

  mount.innerHTML = '';
  const chartElement = React.createElement(Comp, chartProps);
  const root = ReactDOM.createRoot(mount);
  root.render(chartElement);
};

// 创建 advisor 实例并为该实例绑定自定义渲染器
const advisor = new Advisor();

const sampleData = {
  type: 'area',
  data: [
    { time: '2018', value: 91.9 },
    { time: '2019', value: 99.1 },
    { time: '2020', value: 101.6 },
    { time: '2021', value: 114.4 },
    { time: '2022', value: 121 },
  ],
};

const RenderDemand: React.FC = () => {

  useEffect(() => {
    bindRenderer(demandRender as any);
    render();
  }, []);

  const render = async () => {
    const dataShards = await advisor.extract({ purpose: '请根据数据生成图表建议', data: sampleData });
    const advises = await advisor.advise(dataShards);
    advisor.render('#chart', advises[0].charts[0].spec);
  };

  return (
    <div id="chart"/>
  );
};

export default RenderDemand;

```
## 使用 <GPT-Vis />


## GPT-Vis SSR图表
