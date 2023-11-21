---
title: getInsights
order: 1
---

<embed src='@/docs/common/style.md'></embed>


提取数据中存在的洞察。

## **getInsights**

<i>(data: Datum[], options?: InsightOptions) => { insights: InsightInfo[], homogeneousInsights?: HomogeneousInsightInfo[] } </i>


从多维数据中运行不同算法来发现数据中有趣的模式，并将不同类型的模式进行统一评估，按照分数返回高质量的数据洞察结果。



* ***InsightOptions*** 自动洞察流程中的一些可选配置。

| 属性 | 类型 | 描述 | 默认值 |  
| ----| ---- | ---- | -----|
| measures | `Measure[]` | 指定作为指标的字段和对应的聚合方法。 | 所有可用于计算的定量（数字）字段。 |
| dimensions | `Dimensions[]` | 指定参与计算的维度。 | 所有分类、时间字段 |
| insightTypes |  `InsightType[]` | 指定参与计算的洞察类型。 | `['category_outlier', 'trend', 'change_point', 'time_series_outlier', 'majority','low_variance', 'correlation']`(所有支持类型) |
| limit |  `number` | 返回分数最高的前N个洞察信息 | 30 |
| visualization |  `boolean \| InsightVisualizationOptions` | 是否输出洞察的可视化方案，及可视化输出配置项 | `false` |
| impactMeasures |  `ImpactMeasure[]` | 指定Impact分数的计算指标。 | 无 |
| impactWeight |  `number ∈(0, 1)` | 指定洞察分数计算的Impact权重： Insight score = Impact score * impactWeight + Significance * (1 - impactWeight). | `0.3` |
| homogeneous |  `boolean` | 是否提取数据中的共性洞察 | `false` |
| ignoreSubspace |  `boolean` | 是否关闭对子空间的洞察提取 | `false` |
| algorithmParameter | `AlgorithmParameter` | 可调的算法参数 | `{}` |

* ***InsightVisualizationOptions*** 可视化输出配置

| 属性 | 类型 | 描述 | 默认值 |  
| ----| ---- | ---- | -----|
| lang | `en-US`\|`zh-CN` | 洞察描述返回纯文本或者文本结构化描述 | 'en-US' |


* ***InsightInfo|HomogeneousInsightInfo*** 洞察信息

| 属性 | 类型 | 描述 | 示例 |  
| ----| ---- | ---- | -----|
| subspace | `Subspace` | 该洞察数据主体的子空间信息（Subspace）。 | `[{ dimension: 'Year', value: '2000' }]`(子空间为 Year = 2000) |
| dimensions | `string[]` | 该洞察数据主体的维度, 并且作为下一轮子空间划分的分组维度。 | `[fieldName: 'country']` |
| measures |  `Measure[]` | 该洞察数据主体的计算指标。 | `[{ field: 'life_expect', method: 'MEAN' }]` |
| data |  `Datum[]` | 该洞察数据主体的相关数据。 | `[{ country: 'China', life_expect: 61 }]` |
| patterns |  `PatternInfo[] \| HomogeneousPatternInfo[]` | 该洞察数据主体上的模式集合 | `[{ type: 'outlier', significance: 0.98, dimension: 'country', measure: 'life_expect', index: 5, x: 'china', y: '43' }, ...]` |
| visualizationSpecs |  `visualizationSpec[]` | 该洞察的可视化方案，包含图表类型、标题、洞察描述以及图表配置（基于G2Plot） | `[{ type: 'column_chart', caption: string, narrativeSpec: string[] \| IPhrase[][], chartSpec: G2PlotConfig }]` |


<embed src='@/docs/common/phrase.zh.md'></embed>

### 用例

* 指定参与计算的指标和维度，以及返回的洞察数量。

```ts
import { getInsights } from '@antv/ava';

getInsights(data, {
  limit: 30,
  dimensions: ['year', 'country'],
  measures: [
    { fieldName: 'life_expect', method: 'MEAN' },
    { fieldName: 'pop', method: 'SUM' },
    { fieldName: 'fertility', method: 'MEAN' },
  ]
});
```

* 设置影响力（Impact）分数的计算指标，调整洞察分数计算中的相关因子（置信度、影响力）的计算权重。

```ts
import { getInsights } from '@antv/ava';

getInsights(data, {
  impactWeight: 0.5,
  impactMeasures: [
    { fieldName: 'life_expect', method: 'COUNT' },
    { fieldName: 'pop', method: 'SUM' },
  ]
});
```

* 开启数据中的共性/例外模式提取。

```ts
import { getInsights } from '@antv/ava';

const result = getInsights(data, {
  homogeneous: true
});

const { insights, homogeneousInsights } = result;
console.log(homogeneousInsights);

```
