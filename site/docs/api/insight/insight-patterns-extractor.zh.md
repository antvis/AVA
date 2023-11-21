---
title: insightPatternsExtractor
order: 2
---

<embed src='@/docs/common/style.md'></embed>


从数据中提取的指定类型的洞察。

## **insightPatternsExtractor**

<i>(props: InsightExtractorProps): PatternInfo[]</i>


* ***InsightExtractorProps*** 配置项

| 属性 | 类型 | 描述 | 示例 |  
| ----| ---- | ---- | -----|
| data | `Datum[]` | 数据 | `[{ value: 1000, year: 2023 }, { value: 900, year: 2022 }]` |
| measures | `Measure[]` | 指定作为指标的字段和对应的聚合方法 | `[{ fieldName: 'value', method: 'SUM' }]` |
| dimensions | `Dimensions[]` | 指定参与计算的维度 | `[fieldName: 'year']` |
| insightType |  `InsightType[]` | 指定计算的洞察类型 | `['category_outlier', 'trend', 'change_point', 'time_series_outlier', 'majority','low_variance', 'correlation']`(所有支持类型) |
| options |  `InsightExtractorOptions` | 可选配置项 |  |

* ***InsightExtractorOptions*** 可选配置项

| 属性 | 类型 | 描述 | 默认值 |  
| ----| ---- | ---- | -----|
| algorithmParameter | `AlgorithmParameter` | 可调的算法参数 | `{}` |
| filterInsight | `boolean` | 是否过滤有效洞察 | `false` |
| dataValidation | `boolean` | 是否校验数据是否符合要求 | `false` |
| dataProcessInfo | `Extra` | 数据校验时数据处理的配置 | `{}` |
| visualizationOptions | `InsightVisualizationOptions` | 可视化spec配置 | `{ lang: 'zh-CN' }` |

* ***PatternInfo*** 包含以下几种洞察类型

| 类型 | 描述 | 示例 |  
| ----| ---- | ---- |
| TrendInfo | 趋势 | `{ type: 'trend', significance: 0.99, trend: 'decreasing', regression: {} }`|
| TimeSeriesOutlierInfo | 时序异常 | `{ type: 'time_series_outlier', significance: 0.96, baselines: [], thresholds: [], x: 12, y: 32, index: 2 }` |
| CategoryOutlierInfo |  类别 | `{ type: 'category_outlier', significance: 0.97, x: 12, y: 32, index: 2 }` |
| LowVarianceInfo |  低方差 | `{ type: 'low_variance', significance: 0.99, dimension: 'year', measure: 'country', mean: 43 }` |
| ChangePointInfo |  突变点 | `{ type: 'change_point', significance: 0.90, x: 12, y: 32, index: 2 }` |
| CorrelationInfo |  相关性 | `{ type: 'correlation', significance: 0.96, pcorr: 0.9, measure: [] }` |
| MajorityInfo |  主要影响因素 | `{ type: 'majority', significance: 0.98, proportion: 0.6, x: 12, y: 32, index: 2 }` |

### 用例

* 指定从数据中提取趋势类型的洞察结果。

```ts
import { insightPatternsExtractor } from '@antv/ava';

insightPatternsExtractor({
  data,
  measures: [{ fieldName: 'life_expect', method: 'MEAN' }],
  dimensions: [{ fieldName: 'date' }],
  insightType: 'trend',
});
```
