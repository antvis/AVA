---
title: Introduction to SmartBoard
order: 0
---

`markdown:docs/common/style.md`



Generating Dashboard based on input charts and insights。

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

## 🔨 Usage

SmartBoard is the class employed for constructing a `SmartBoard` instance. Through this instance, some Dashboard related methods can be employed by users.

```ts
import { SmartBoard } from '@antv/smart-board';

const smartBoard = new SmartBoard(InputChart);
```

The initialization method of the SmartBoard instance creation requires a series of input charts that matches `InputChart` array.

```ts
initChart(chart as InputChart);

interface InputChart {
  id?: string;
  data: string;
  subspace: Subspace[] | [];
  dimensions: string[];
  measures: string[];
  dataUrl?: string;
  fieldInfo?: any;
  insightType?: InsightType;
  score?: number;
  chartType?: ChartType;
  chartSchema?: any;
  description?: string | string[];
}
```

SmartBoard also provides a function `insights2Board` to generate `InputChart` array directly using the output of LiteInsight.

```ts
import { SmartBoard, insights2Board } from '@antv/smart-board';
import { getDataInsights } from '@antv/lite-insight';

const insightResult = getDataInsights(data, {
  limit: ...,
  measures: ...,
  visualization: true,
});

const insightCharts = insights2Board(insightResult.insights);

const smartBoard = new SmartBoard(insightCharts);
```

After initialization, the SmartBoard instance is ready to be used by calling the relevant methods.

To add a chart for constructing a Dashboard.

```ts
SmartBoard.addChart(newChart as InputChart);
```

To get the chart that constructs the Dashboard.

```ts
SmartBoard.getCharts;
```

To get the ChartGraph that holds the association between charts, as defined by AntV-G6.

```ts
SmartBoard.chartGraph;
```

To get the ChartOrder that holds the order of the charts, the output order is determined by both the data insight score and the chart association relationship.

```ts
SmartBoard.chartOrder(type as OrderType): ;
```

To get ChartCluster that holds the chart clustering relationships, via using the Louvain algorithm.

```ts
SmartBoard.chartCluster();
```

### Dashboard Component

To simplify the usage cost, SmartBoard also provides a React component `<SmartBoardDashboard>` for rendering dashboard based on the above `SmartBoard` instance.

```ts
import { SmartBoardDashboard } from '@antv/smart-board';

ReactDOM.render(
  <>
    <SmartBoardDashboard
      chartList={SmartBoard.getCharts()}
      interactionMode={'defaultMode'}
      hasInsight={true}
      chartGraph={SmartBoard.chartGraph()}
      chartOrder={SmartBoard.chartOrder(orderType)}
      chartCluster={SmartBoard.chartCluster()}
      plotRender={g2plotRender}
    />
  </>,
  mountNode,
);
```

## 📖 Documentation

For more usages, please check the [API Reference](https://ava.antv.vision/en/docs/api/smart-board/SmartBoard)



