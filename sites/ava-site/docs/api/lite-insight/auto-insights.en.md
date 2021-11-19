---
title: getDataInsights
order: 3
---

`markdown:docs/common/style.md`



Automatically discovering interesting patterns from multi-dimensional data.

## **getDataInsights**

<i>(data: Datum[], options?: InsightOptions) => { insights: InsightInfo[], homogeneousInsights?: HomogeneousInsightInfo[] } </i>

Run different algorithms from multi-dimensional data to discover interesting patterns in the data, and perform unified evaluation of different types of patterns, and return high-quality data insights based on scores.

* ***InsightOptions*** configure the pipeline of Auto-Insights.

| Properties | Type | Description | Default|  
| ----| ---- | ---- | -----|
| measures | `Measure[]` | Specify the fields as measures and the corresponding aggregation methods. | All quantitative (numeric) fields |
| dimensions | `Dimensions[]` | Specify the dimensions involved in the calculation. | All categorical, time fields |
| insightTypes |  `InsightType[]` | Specify the types of insight. | `['category_outlier', 'trend', 'change_point', 'time_series_outlier', 'majority','low_variance']`(All supported types) |
| limit |  `number` | Limit on the number of insights. | 30 |
| visualization |  `boolean | VisualizationOptions` | on / off the output of visualization scheme, or visualization options. | `false` |
| impactMeasures |  `ImpactMeasure[]` | Measures for Impact score. | none |
| impactWeight |  `number ∈(0, 1)` | Insight score = Impact score * impactWeight + Significance * (1 - impactWeight). | `0.3` |
| homogeneous |  `boolean` | on/off extra homogeneous insight extraction. | `false` |
| ignoreSubspace |  `boolean` | Whether to close the search for subspaces. | `false` |

* ***VisualizationOptions*** Insight output visualization options

| Properties | Type | Description | Default| 
| ----| ---- | ---- | -----|
| summaryType |  `text`\|`schema` | pure text or text schema to description insight summary | 'text' |

* ***InsightInfo|HomogeneousInsightInfo*** Insight information.

| Properties | Type | Description | Example|  
| ----| ---- | ---- | -----|
| subspace | `Subspace` | The subspace of the data subject | `[{ dimension: 'Year', value: '2000' }]`(subspace: Year = 2000) |
| dimensions | `string[]` | The dimensions of the data subject | `['country']` |
| measures |  `Measure[]` | The measures of the data subject | `[{ field: 'life_expect', method: 'MEAN' }]` |
| data |  `Datum[]` | data | `[{ country: 'China', life_expect: 61 }]` |
| patterns |  `PatternInfo[]` | The collection of patterns in the data | `[{ type: 'outlier', significance: 0.98, dimension: 'country', measure: 'life_expect', index: 5, x: 'china', y: '43' }, ...]` |
| visualizationSchemas |  `VisualizationSchema[]` | The insight visualization scheme, including chart type, title, insight description, and chart configuration (based on G2Plot) | `[{ type: 'column_chart', caption: string, insightSummaries: string[] | IPhrase[][], chartSchema: G2PlotConfig }]` |

`markdown:docs/common/phrase.en.md`

### Usage

* Specify the measures and dimensions involved in the calculation, and the number of insights returned.

```ts
import { getDataInsights } from '@antv/lite-insight';

getDataInsights(data, {
  limit: 30,
  dimensions: ['year', 'country'],
  measures: [
    { field: 'life_expect', method: 'MEAN' },
    { field: 'pop', method: 'SUM' },
    { field: 'fertility', method: 'MEAN' },
  ]
});
```

* Set the measures of the impact score, and adjust the calculation weight of the relevant factors (significance, impact) in the calculation of the insight score.

```ts
import { getDataInsights } from '@antv/lite-insight';


getDataInsights(data, {
  impactWeight: 0.5,
  impactMeasures: [
    { field: 'life_expect', method: 'COUNT' },
    { field: 'pop', method: 'SUM' },
  ]
});
```

* Enable the extraction of homogeneous data patterns.

```ts
import { getDataInsights } from '@antv/lite-insight';

const result = getDataInsights(data, {
  homogeneous: true
});

const { insights, homogeneousInsights } = result;
console.log(homogeneousInsights);

```


## **getDataInsightsAsync**

<i>(data: Datum[], options?: InsightOptions) => Promise\<{ insights: InsightInfo[], homogeneousInsights?: HomogeneousInsightInfo[] }\></i>

Async version of ```getDataInsights```.


