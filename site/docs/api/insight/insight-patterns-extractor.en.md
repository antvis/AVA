---
title: insightPatternsExtractor
order: 2
---

<embed src='@/docs/common/style.md'></embed>


Extract specified types of insights from the data.

## **insightPatternsExtractor**

<i>(props: InsightExtractorProps): PatternInfo[]</i>


* ***InsightExtractorProps*** configuration of insightPatternsExtractor

| Properties | Type | Description | Default|  
| ----| ---- | ---- | -----|
| data | `Datum[]` | data | `[{ value: 1000, year: 2023 }, { value: 900, year: 2022 }]` |
| measures | `Measure[]` | Specify the fields as measures and the corresponding aggregation methods | `[{ fieldName: 'value', method: 'SUM' }]` |
| dimensions | `Dimensions[]` | Specify the dimensions involved in the calculation | `[fieldName: 'year']` |
| insightType |  `InsightType[]` | Specify the types of insight | `['category_outlier', 'trend', 'change_point', 'time_series_outlier', 'majority','low_variance', 'correlation']`(All supported types) |
| options |  `InsightExtractorOptions` | optional configuration |  |

* ***InsightExtractorOptions*** optional configuration

| Properties | Type | Description | Default|  
| ----| ---- | ---- | -----|
| algorithmParameter | `AlgorithmParameter` | Adjustable algorithm parameters | `{}` |
| filterInsight | `boolean` | Whether to filter significant insights | `false` |
| dataValidation | `boolean` | Whether to verify whether the data meets the requirements | `false` |
| dataProcessInfo | `Extra` | Configuration of data processing during data verification | `{}` |
| visualizationOptions | `InsightVisualizationOptions` | visualization options | `{ lang: 'zh-CN' }` |

* ***PatternInfo*** Includes the following types of insights

| Type | Description | Example|  
| ----| ---- | ---- |
| TrendInfo | trend | `{ type: 'trend', significance: 0.99, trend: 'decreasing', regression: {} }`|
| TimeSeriesOutlierInfo | time series outlier | `{ type: 'time_series_outlier', significance: 0.96, baselines: [], thresholds: [], x: 12, y: 32, index: 2 }` |
| CategoryOutlierInfo |  category outlier | `{ type: 'category_outlier', significance: 0.97, x: 12, y: 32, index: 2 }` |
| LowVarianceInfo |  low variance | `{ type: 'low_variance', significance: 0.99, dimension: 'year', measure: 'country', mean: 43 }` |
| ChangePointInfo |  change point | `{ type: 'change_point', significance: 0.90, x: 12, y: 32, index: 2 }` |
| CorrelationInfo |  correlation | `{ type: 'correlation', significance: 0.96, pcorr: 0.9, measure: [] }` |
| MajorityInfo |  majority | `{ type: 'majority', significance: 0.98, proportion: 0.6, x: 12, y: 32, index: 2 }` |

### 用例

* Extract trend insights from the data.

```ts
import { insightPatternsExtractor } from '@antv/ava';

insightPatternsExtractor({
  data,
  measures: [{ fieldName: 'life_expect', method: 'MEAN' }],
  dimensions: [{ fieldName: 'date' }],
  insightType: 'trend',
});
```
