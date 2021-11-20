<img src="https://gw.alipayobjects.com/zos/antfincdn/R8sN%24GNdh6/language.svg" width="18"> [English](./README.md) | 简体中文


<h1 align="center">
<b>@antv/smart-board</b>
</h1>

<div align="center">
一个 js/ts 的前端图表 Dashboard 计算和绘制库。


[![Version](https://badgen.net/npm/v/@antv/smart-board)](https://www.npmjs.com/@antv/smart-board)
[![NPM downloads](http://img.shields.io/npm/dm/@antv/smart-board.svg)](http://npmjs.com/@antv/smart-board)
</div>


## ✨ 功能特性

* **Dashboard 生成**: 基于给定图表自动的计算 Dashboard 所需属性。
* **Dashboard 绘制**: 提供基于上述属性的 React Dashboard 绘制组件 `SmartBoardDashboard`。
* **结合洞察**: 可以与 [LiteInsight](https://ava.antv.vision/zh/docs/api/lite-insight/auto-insights) 结合从而展示数据背后的洞察信息。

SmartBoard 的流程图如下：

<img src='https://gw.alipayobjects.com/mdn/rms_fabca5/afts/img/A*1P_URIfu2GwAAAAAAAAAAAAAARQnAQ' alt='SmartBoard pipeline' />

## 📦 安装

```bash
$ npm install @antv/smart-board
```

## 🔨 快速开始


```ts
import { SmartBoard, SmartBoardDashboard } from '@antv/smart-board';

const cars = 'https://cdn.jsdelivr.net/npm/vega-datasets@2/data/cars.json';

const InputChart = [
  {
    dataUrl: cars,
    subspaces: [],
    breakdowns: ['Origin'],
    measures: ['Horsepower'],
    fieldInfo: {
      Origin: {
        dataType: 'string',
      },
      Horsepower: {
        dataType: 'number',
      },
    },
    insightType: 'outlier',
    score: 0.5,
    chartType: 'column_chart',
  },
  {
    dataUrl: cars,
    subspaces: [],
    breakdowns: ['Year'],
    measures: ['Acceleration'],
    insightType: 'trend',
    score: 0.8,
    chartType: 'line_chart',
  },
];

const smartBoard = new SmartBoard(InputChart);

const dashboardContent = 
  (<SmartBoardDashboard
    chartList={InputChart}
    interactionMode={'defaultMode'}
    chartGraph={smartBoard?.chartGraph}
    chartOrder={smartBoard?.chartOrder('byCluster')}
    chartCluster={smartBoard?.chartCluster()}
  />);
```

## 📖 文档

更多用法请移步至 [官网API](https://ava.antv.vision/zh/docs/api/smart-board/SmartBoard)



## 📄 许可证

MIT
