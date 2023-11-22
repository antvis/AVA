---
title: getSpecificInsight
order: 3
---

<embed src='@/docs/common/style.md'></embed>

从数据中提取的指定类型的洞察和对应的可视化spec。

## **getSpecificInsight**

<i>(props: SpecificInsightProps): SpecificInsightResult</i>

* ***SpecificInsightProps*** 和`InsightExtractorProps`相同，详见 [InsightExtractorProps API](./insight-patterns-extractor.zh.md)。

* ***SpecificInsightResult*** 输出内容

| 属性 | 类型 | 描述 | 示例 |  
| ----| ---- | ---- | -----|
| subspace | `Subspace` | 该洞察数据主体的子空间信息（Subspace）。 | `[{ dimension: 'Year', value: '2000' }]`(子空间为 Year = 2000) |
| dimensions | `string[]` | 该洞察数据主体的维度, 并且作为下一轮子空间划分的分组维度。 | `[fieldName: 'country']` |
| measures |  `Measure[]` | 该洞察数据主体的计算指标。 | `[{ field: 'life_expect', method: 'MEAN' }]` |
| data |  `Datum[]` | 该洞察数据主体的相关数据。 | `[{ country: 'China', life_expect: 61 }]` |
| patterns |  `PatternInfo[]` | 该洞察数据主体上的模式集合 | `[{ type: 'outlier', significance: 0.98, dimension: 'country', measure: 'life_expect', index: 5, x: 'china', y: '43' }, ...]` |
| visualizationSpecs |  `visualizationSpec[]` | 该洞察的可视化方案，包含图表类型、标题、洞察描述以及图表配置（基于G2Plot） | `[{ type: 'column_chart', caption: string, narrativeSpec: string[] \| IPhrase[][], chartSpec: G2PlotConfig }]` |

### 用例

* 指定从数据中提取时序异常类型的洞察结果。

```ts
import { getSpecificInsight } from '@antv/ava';

getSpecificInsight({
  data,
  measures: [{ fieldName: 'life_expect', method: 'MEAN' }],
  dimensions: [{ fieldName: 'date' }],
  insightType: 'time_series_outlier',
});
```

* 自定义算法参数

```ts
import { getSpecificInsight } from '@antv/ava';

const insightResult = getSpecificInsight({
  data,
  measures: [{ fieldName: 'life_expect', method: 'MEAN' }],
  dimensions: [{ fieldName: 'date' }],
  insightType: 'time_series_outlier',
  options: {
    // 筛选显著的洞察结果
    filterInsight: true,
    // 进行数据校验
    dataValidation: true,
    // 调整显著性检验的相关参数
    algorithmParameter: {
      outlier: {
        method: 'IQR',
        iqrK: 1.5,
      },
    },
  }
});
```
