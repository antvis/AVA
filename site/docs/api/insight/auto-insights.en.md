---
title: getInsights
order: 1
---

<embed src='@/docs/common/style.md'></embed>


Automatically discovering interesting patterns from multi-dimensional data.

## **getInsights**

<i>(data: Datum[], options?: InsightOptions) => { insights: InsightInfo[], homogeneousInsights?: HomogeneousInsightInfo[] } </i>

Run different algorithms from multi-dimensional data to discover interesting patterns in the data, and perform unified evaluation of different types of patterns, and return high-quality data insights based on scores.

* ***InsightOptions*** configure the pipeline of Auto-Insights.

| Properties | Type | Description | Default|  
| ----| ---- | ---- | -----|
| measures | `Measure[]` | Specify the fields as measures and the corresponding aggregation methods. | All quantitative (numeric) fields |
| dimensions | `Dimensions[]` | Specify the dimensions involved in the calculation. | All categorical, time fields |
| insightTypes |  `InsightType[]` | Specify the types of insight. | `['category_outlier', 'trend', 'change_point', 'time_series_outlier', 'majority','low_variance', 'correlation']`(All supported types) |
| limit |  `number` | Limit on the number of insights. | 30 |
| visualization |  `boolean \| InsightVisualizationOptions` | on / off the output of visualization scheme, or visualization options. | `false` |
| impactMeasures |  `ImpactMeasure[]` | Measures for Impact score. | none |
| impactWeight |  `number ∈(0, 1)` | Insight score = Impact score * impactWeight + Significance * (1 - impactWeight). | `0.3` |
| homogeneous |  `boolean` | on/off extra homogeneous insight extraction. | `false` |
| ignoreSubspace |  `boolean` | Whether to close the search for subspaces. | `false` |
| algorithmParameter | `AlgorithmParameter` | Adjustable algorithm parameters | none |
| dataProcessInfo | `Extra` | Configuration of data processing during data verification | none |

* ***AlgorithmParameter*** Adjustable algorithm parameters

| Properties | Type | Description | Default|   
| ----| ---- | ---- | -----|
| outlier | `OutlierParameter` | parameter of category outlier and time series outlier algorithm | `{ method: 'IQR', iqrK: 1.5, confidenceInterval: 0.95 }` |
| trend | `CommonParameter` | Parameters of the trend algorithm | `{ threshold： 0.05 }` |
| changePoint | `CommonParameter` | Parameter of the change point algorithm | `{ threshold： 0.05 }` |
| correlation | `PCorrTestParameter` |  Parameter of the correlation algorithm | `{ alpha 0.05, alternative: 'two-sided', rho: 0 }` |
| lowVariance | `LowVarianceParameter` | Parameter of the low variance algorithm | `{ cvThreshold 0.15 }` |
| majority | `MajorityParameter` | Parameter of the majority algorithm | `{ limit 0.6 }` |

* ***Extra*** Parameter passed through to the data frame during data pre-processing

| Properties | Type | Description | Default|  
| ----| ---- | ---- | -----|
| strictDatePattern | `boolean` | Whether only the main standard symbols recommended in ISO 8601 can be recognized as date fields | `true` |

* ***InsightVisualizationOptions*** Insight output visualization options

| Properties | Type | Description | Default| 
| ----| ---- | ---- | -----|
| lang |  `en-US`\|`zh-CN` | explain insight use which language | 'en-US' |

* ***InsightInfo|HomogeneousInsightInfo*** Insight information.

| Properties | Type | Description | Example|  
| ----| ---- | ---- | -----|
| subspace | `Subspace` | The subspace of the data subject | `[{ dimension: 'Year', value: '2000' }]`(subspace: Year = 2000) |
| dimensions | `string[]` | The dimensions of the data subject | `['country']` |
| measures |  `Measure[]` | The measures of the data subject | `[{ field: 'life_expect', method: 'MEAN' }]` |
| data |  `Datum[]` | data | `[{ country: 'China', life_expect: 61 }]` |
| patterns |  `PatternInfo[] \| HomogeneousPatternInfo[]` | The collection of patterns in the data | `[{ type: 'outlier', significance: 0.98, dimension: 'country', measure: 'life_expect', index: 5, x: 'china', y: '43' }, ...]` |
| visualizationSpecs |  `InsightVisualizationSpec[]` | The insight visualization scheme, including chart type, title, insight description, and chart configuration (based on G2Spec) | `[{ type: 'column_chart', caption: string, narrativeSpec: string[] \| IPhrase[][], chartSpec: G2Spec }]` |

<embed src='@/docs/common/phrase.en.md'></embed>

### Usage

* Specify the measures and dimensions involved in the calculation, and the number of insights returned.

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

* Set the measures of the impact score, and adjust the calculation weight of the relevant factors (significance, impact) in the calculation of the insight score.

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

* Enable the extraction of homogeneous data patterns.

```ts
import { getInsights } from '@antv/ava';

const result = getInsights(data, {
  homogeneous: true
});

const { insights, homogeneousInsights } = result;
console.log(homogeneousInsights);

```
