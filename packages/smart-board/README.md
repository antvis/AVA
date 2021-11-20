<img src="https://gw.alipayobjects.com/zos/antfincdn/R8sN%24GNdh6/language.svg" width="18"> English | [简体中文](./README.zh-CN.md)


<h1 align="center">
<b>@antv/smart-board</b>
</h1>

<div align="center">
A js/ts library that solves dashboarding calculation and drawing problems for charts.


[![Version](https://badgen.net/npm/v/@antv/smart-board)](https://www.npmjs.com/@antv/smart-board)
[![NPM downloads](http://img.shields.io/npm/dm/@antv/smart-board.svg)](http://npmjs.com/@antv/smart-board)
</div>


## ✨ Features

* **Auto-Dashboarding**: Automatically compute dashboarding configurations based on input chart schemas.
* **Dashboard Drawing**: Provides a React component `SmartBoardDashboard` for Dashboard drawing based on the above configurations.
* **Combine with Insight**: Easily combined with [LiteInsight](https://ava.antv.vision/en/docs/api/lite-insight/auto-insights) for better visualize insights behind data.

The pipeline of SmartBoard:

<img src='https://gw.alipayobjects.com/mdn/rms_fabca5/afts/img/A*1P_URIfu2GwAAAAAAAAAAAAAARQnAQ' alt='SmartBoard pipeline' />

## 📦 Installation

```bash
$ npm install @antv/smart-board
```

## 🔨 Getting Started


```ts
import { SmartBoard, SmartBoardDashboard } from '@antv/smart-board';

const cars = 'https://cdn.jsdelivr.net/npm/vega-datasets@2/data/cars.json';

const InputChart = [
  {
    dataUrl: cars,
    subspace: [],
    dimensions: ['Origin'],
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
    subspace: [],
    dimensions: ['Year'],
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

## 📖 Documentation

For more usages, please check the [API Reference](https://ava.antv.vision/en/docs/api/smart-board/SmartBoard)


## 📄 License

MIT
