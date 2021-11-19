---
title: SmartBoard
order: 1
---

`markdown:docs/common/style.md`



```sign
Class SmartBoard(inputCharts: InputChart[])
```

## Initial Parameters

* **inputCharts** * Data
  * _required parameter_ 
  * `Parameter type`: array of InputChart objects

* `InputChart` * InputChart

* ***InputChart*** Parameter configuration.

| Properties | Type | Description | Default |  
| ----| ---- | ---- | -----|
| id | `string` | Chart ID。 | Auto-generated `Optional` |
| data | `any[]` | The source data. | None |
| dataUrl | `string` | The address of the data source. | None `Optional` |
| subspace | `Subspace[]` | The data subspace information. | None |
| dimensions | `string[]` | The dimension of the data. | None |
| measures | `string[]` | The indicator field. | None |
| fieldInfo | `any` | The data field information. | None `Optional` |
| insightTypes | `InsightType[]` | The insight type. | None `Optional` |
| score | `number` | The score of the insight. | None `Optional` |
| chartType | `ChartType` | The chart type. | None `Optional` |
| chartSchema | `any` | The specified visualization scheme, such as chart configuration, title, etc. | None `Optional` |
| description | `string | string[]` | The chart description information. | None `Optional` |

## Functions

### SmartBoard.getCharts

To get the chart that constructs the Dashboard.

```ts
SmartBoard.getCharts: InputChart[];
```

Return value: `InputChart[]`

### SmartBoard.chartGraph

To get the ChartGraph that holds the correlations between charts defined by [G6](https://g6.antv.vision/): 

```ts
SmartBoard.chartGraph;
```

Return value:

```ts
interface ChartGraph {
  nodes: Chart[];
  links: link[];
}
```

### SmartBoard.chartOrder

To get the ChartOrder that holds the order of the charts, the output order is determined by both the data insight score and the chart association.

```ts
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

### SmartBoard.chartCluster

To obtain ChartCluster, which holds the clustering relationships of the charts via using the Louvain algorithm.

```ts
SmartBoard.chartCluster(): ChartCluster;
```

Return value:

```ts
type ChartCluster = Record<string, number>;
```

### insights2Board

Transfer the output insight of LiteInsight to the `InputChart` array employed when initial SmartBoard.

```ts
insights2Board(insights: InsightInfo): InputChart[];
```

Parameter: [InsightInfo](../lite-insight/auto-insights#getDataInsights)




