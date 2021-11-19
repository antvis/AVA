---
title: SmartBoard
order: 1
---

`markdown:docs/common/style.md`



```sign
Class SmartBoard(inputCharts: InputChart[])
```

## 初始化参数

* **inputCharts** * 数据
  * _必要参数_
  * `参数类型`: InputChart 对象数组

*`InputChart`* 输入图表

* ***InputChart*** 参数配置。

| 属性 | 类型 | 描述 | 默认值 |  
| ----| ---- | ---- | -----|
| id | `string` | 图表 ID。 | 自动生成  `可选` |
| data | `any[]` | 源数据。 | 无 |
| dataUrl | `string` | 数据源地址。 | 无  `可选` |
| subspace | `Subspace[]` | 数据子空间信息。 | 无 |
| dimensions | `string[]` | 数据维度。 | 无 |
| measures | `string[]` | 指标字段。 | 无 |
| fieldInfo | `any` | 数据字段信息。 | 无  `可选` |
| insightTypes |  `InsightType[]` | 洞察类型。 | 无  `可选` |
| score |  `number` | 洞察评分。 | 无  `可选` |
| chartType |  `ChartType` | 图表类型。 | 无  `可选` |
| chartSchema |  `any` | 指定的可视化方案，比如图表配置、标题等。 | 无  `可选` |
| description |  `string | string[]` | 图表描述信息。 | 无  `可选` |

## 方法

### SmartBoard.getCharts

获取构造 Dashboard 的图表：

```ts
SmartBoard.getCharts: InputChart[];
```

返回值：`InputChart[]`

### SmartBoard.chartGraph

获得保存图表间关联关系的 ChartGraph，关联关系由 AntV-G6 定义：

```ts
SmartBoard.chartGraph;
```

返回值：

```ts
interface ChartGraph {
  nodes: Chart[];
  links: link[];
}
```

### SmartBoard.chartOrder

获得保存图表顺序的 ChartOrder，输出顺序由数据洞察分数和图表关联关系共同决定：

```ts
SmartBoard.chartOrder(type: OrderType): ChartOrder;
```

参数：

```ts
type OrderType = 'byInsightScore' | 'byCluster';
```

返回值：

```ts
type ChartOrder = Record<string, number>;
```

### SmartBoard.chartCluster

获得保存图表聚类关系的 ChartCluster，聚类算法采用 Louvain 算法：

```ts
SmartBoard.chartCluster(): ChartCluster;
```

返回值：

```ts
type ChartCluster = Record<string, number>;
```

## 其他方法

### insights2Board

将 LiteInsight 输出的洞察结果转化为初始化 SmartBoard 所需要的图表数组：

```ts
insights2Board(insights: InsightInfo): InputChart[];
```

参数：[InsightInfo](../lite-insight/auto-insights#getDataInsights)



