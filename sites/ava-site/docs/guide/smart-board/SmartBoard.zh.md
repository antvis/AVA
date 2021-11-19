---
title: SmartBoard 简介
order: 0
---

`markdown:docs/common/style.md`



根据输入图表和洞察自动生成 Dashboard。

## ✨ 功能特性

* **Dashboard 生成**: 基于给定图表自动的计算 Dashboard 所需属性。
* **Dashboard 绘制**: 提供基于上述属性的 React Dashboard 绘制组件 `SmartBoardDashboard`。
* **结合洞察**: 可以与 [LiteInsight](https://ava.antv.vision/zh/docs/api/lite-insight/auto-insights) 结合从而展示数据背后的洞察信息。

SmartBoard 的流程如下：

<img src='https://gw.alipayobjects.com/mdn/rms_fabca5/afts/img/A*1P_URIfu2GwAAAAAAAAAAAAAARQnAQ' alt='SmartBoard pipeline' />

## 📦 安装

```bash
$ npm install @antv/smart-board
```

## 🔨 使用


SmartBoard 是负责构造实例的 class，可用于生成一个 SmartBoard 实例。通过该实例，可以使用到 Dashboard 相关方法。

```ts
import { SmartBoard } from '@antv/smart-board';

const smartBoard = new SmartBoard(InputChart);
```

SmartBoard 实例创建的初始化方法需要输入类型符合 InputChart 的参数。

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

SmartBoard 也提供了直接使用 LiteInsight 的输出结果生成 InputChart 初始化的方法 insights2Board。

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

初始化之后，SmartBoard 实例就可以调用相关方法进行使用。

增加构造 Dashboard 的图表：

```ts
SmartBoard.addChart(newChart as InputChart);
```

获取构造 Dashboard 的图表：

```ts
SmartBoard.getCharts;
```

获得保存图表间关联关系的 ChartGraph，关联关系由 AntV-G6 定义：

```ts
SmartBoard.chartGraph;
```

获得保存图表顺序的 ChartOrder，输出顺序由数据洞察分数和图表关联关系共同决定：

```ts
SmartBoard.chartOrder(type as OrderType): ;
```

获得保存图表聚类关系的 ChartCluster，聚类算法采用 Louvain 算法：

```ts
SmartBoard.chartCluster();
```

### Dashboard 组件使用

为了简化使用成本，SmartBoard 也提供了基于上述实例展示 Dashboard 的 React 组件 `<SmartBoardDashboard>` 进行使用。

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

## 📖 文档

更多用法请移步至 [官网API](https://ava.antv.vision/zh/docs/api/smart-board/SmartBoard)



