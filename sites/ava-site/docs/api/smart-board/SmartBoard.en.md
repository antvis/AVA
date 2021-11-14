---
title: SmartBoard
order: 1
---

`markdown:docs/common/style.md`

<div class='doc-md'>

```sign
Class SmartBoard(inputCharts: InputChart[])
```
### Parameters

* **inputCharts** * Data
  * _required parameter_ 
  * `Parameter type`: array of InputChart objects

* `InputChart` * InputChart

* ***InputChart*** Parameter configuration.

| Properties | Type | Description | Default |  
| ----| ---- | ---- | -----|
| id | `string` | Chart ID。 | auto generated |
| data | `[]` | The source data. | none |
| dataUrl | `string` | The address of the data source. | none |
| subspaces | `Subspace[]` | The data subspace information. | none |
| breakdowns | `string[]` | The dimension of the data. | none |
| measures | `string[]` | The indicator field. | none |
| fieldInfo | `any` | The data field information. | none |
| insightTypes | `InsightType[]` | The insight type. | none |
| score | `number` | The score of the insight. | none |
| chartType | `ChartType` | The chart type. | none |
| chartSchema | `any` | The specified visualization scheme, such as chart configuration, title, etc. | none |
| description | `string | string[]` | The chart description information. | none |

### Methods

#### SmartBoard.getCharts

To get the chart that constructs the Dashboard.
```sign
SmartBoard.getCharts(): InputChart[];
```

Return value: `InputChart[]`

#### SmartBoard.chartGraph

To get the ChartGraph that holds the correlations between charts defined by [G6](https://g6.antv.vision/): 
``sign
```sign
SmartBoard.chartGraph(): ChartGraph;
```

Return value:
```ts
interface ChartGraph {
  nodes: Chart[];
  links: link[];
}
```

#### SmartBoard.chartOrder

To get the ChartOrder that holds the order of the charts, the output order is determined by both the data insight score and the chart association.
```sign
SmartBoard.chartOrder(type: OrderType): ChartOrder;
```

Parameter:
```ts
type OrderType = 'byInsightScore' | 'byCluster';
```

Return value:
```ts
type ChartOrder = Record<string, number>;
```

#### SmartBoard.chartCluster

To obtain ChartCluster, which holds the clustering relationships of the charts via using the Louvain algorithm.
```sign
SmartBoard.chartCluster(): ChartCluster;
```

Return value:
```ts
type ChartCluster = Record<string, number>;
```

#### insights2Board

Transfer the output insight of LiteInsight to the `InputChart` array employed when initial SmartBoard.
```sign
insights2Board(insights: InsightInfo): InputChart[];
```

Parameter: [InsightInfo](../lite-insight/auto-insights#getDataInsights)



</div>
