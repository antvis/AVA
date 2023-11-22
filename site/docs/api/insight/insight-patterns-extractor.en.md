---
title: insightPatternsExtractor
order: 2
---

<embed src='@/docs/common/style.md'></embed>


Extract insight of a specified type from the data.

## **insightPatternsExtractor**

<i>(props: InsightExtractorProps): PatternInfo[]</i>


* ***InsightExtractorProps*** configuration of insightPatternsExtractor

| Properties | Type | Description | Example |  
| ----| ---- | ---- | -----|
| data | `Datum[]` | data | `[{ value: 1000, year: 2023 }, { value: 900, year: 2022 }]` |
| measures | `Measure[]` | Specify the fields as measures and the corresponding aggregation methods | `[{ fieldName: 'value', method: 'SUM' }]` |
| dimensions | `Dimensions[]` | Specify the dimensions involved in the calculation | `[fieldName: 'year']` |
| insightType |  `InsightType[]` | Specify the types of insight | `['category_outlier', 'trend', 'change_point', 'time_series_outlier', 'majority','low_variance', 'correlation']`(All supported types) |
| options |  `InsightExtractorOptions` | optional configuration | none |

* ***InsightExtractorOptions*** optional configuration

The contents of `dataProcessInfo`, `algorithmParameter` and `visualizationOptions` can be seen in [InsightOptions API](./auto-insights.en.md). No further details will be given here.

| Properties | Type | Description | Default|  
| ----| ---- | ---- | -----|
| algorithmParameter | `AlgorithmParameter` | Adjustable algorithm parameters | none |
| filterInsight | `boolean` | Whether to filter significant insights | `false` |
| dataValidation | `boolean` | Whether to verify whether the data meets the requirements | `false` |
| dataProcessInfo | `Extra` | Configuration of data processing during data verification | none |
| visualizationOptions | `InsightVisualizationOptions` | visualization options | `{ lang: 'zh-CN' }` |

* ***PatternInfo*** Includes the following types of insights

| Type | Description | Example|  
| ----| ---- | ---- |
| TrendInfo | trend | `{ type: 'trend', significance: 0.99, trend: 'decreasing', regression: { r2: 0.5, points: [], equation: [] } }`|
| TimeSeriesOutlierInfo | time series outlier | `{ type: 'time_series_outlier', significance: 0.96, baselines: [], thresholds: [], x: 12, y: 32, index: 2 }` |
| CategoryOutlierInfo |  category outlier | `{ type: 'category_outlier', significance: 0.97, x: 12, y: 32, index: 2 }` |
| LowVarianceInfo |  low variance | `{ type: 'low_variance', significance: 0.99, dimension: 'year', measure: 'country', mean: 43 }` |
| ChangePointInfo |  change point | `{ type: 'change_point', significance: 0.90, x: 12, y: 32, index: 2 }` |
| CorrelationInfo |  correlation | `{ type: 'correlation', significance: 0.96, pcorr: 0.9, measure: [] }` |
| MajorityInfo |  majority | `{ type: 'majority', significance: 0.98, proportion: 0.6, x: 12, y: 32, index: 2 }` |

### Usage

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

* Custom algorithm parameters

```ts
import { getSpecificInsight } from '@antv/ava';

const insightResult = getSpecificInsight({
  data,
  measures: [{ fieldName: 'life_expect', method: 'MEAN' }],
  dimensions: [{ fieldName: 'date' }],
  insightType: 'trend',
  options: {
    // Keep insignificant insights
    filterInsight: false,
    // Verify whether the input meets the algorithm requirements
    dataValidation: true,
    // Adjust the significance test threshold
    algorithmParameter: {
      trend: {
        threshold: 0.05,
      },
    },
  }
});
```
