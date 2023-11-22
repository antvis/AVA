---
title: getSpecificInsight
order: 3
---

<embed src='@/docs/common/style.md'></embed>


Extract insight of a specified type from the data and corresponding visualization specs.

## **getSpecificInsight**

<i>(props: SpecificInsightProps): SpecificInsightResult</i>

* ***SpecificInsightProps*** is the same as `InsightExtractorProps`. See [InsightExtractorProps API](./insight-patterns-extractor.en.md) for more details.

* ***SpecificInsightResult*** output

| Properties | Type | Description | Example|  
| ----| ---- | ---- | -----|
| subspace | `Subspace` | The subspace of the data subject | `[{ dimension: 'Year', value: '2000' }]`(subspace: Year = 2000) |
| dimensions | `string[]` | The dimensions of the data subject | `['country']` |
| measures |  `Measure[]` | The measures of the data subject | `[{ field: 'life_expect', method: 'MEAN' }]` |
| data |  `Datum[]` | data | `[{ country: 'China', life_expect: 61 }]` |
| patterns |  `PatternInfo[]` | The collection of patterns in the data | `[{ type: 'outlier', significance: 0.98, dimension: 'country', measure: 'life_expect', index: 5, x: 'china', y: '43' }, ...]` |
| visualizationSpecs |  `InsightVisualizationSpec[]` | The insight visualization scheme, including chart type, title, insight description, and chart configuration (based on G2Spec) | `[{ type: 'column_chart', caption: string, narrativeSpec: string[] \| IPhrase[][], chartSpec: G2Spec }]` |

### Usage

* Extract time series outlier insights from the data.

```ts
import { getSpecificInsight } from '@antv/ava';

getSpecificInsight({
  data,
  measures: [{ fieldName: 'life_expect', method: 'MEAN' }],
  dimensions: [{ fieldName: 'date' }],
  insightType: 'time_series_outlier',
});
```

* Custom algorithm parameters

```ts
import { getSpecificInsight } from '@antv/ava';

const insightResult = getSpecificInsight({
  data,
  measures: [{ fieldName: 'life_expect', method: 'MEAN' }],
  dimensions: [{ fieldName: 'date' }],
  insightType: 'time_series_outlier',
  options: {
    // Filter out not significant insights
    filterInsight: true,
    // Verify whether the input meets the algorithm requirements
    dataValidation: true,
    // Adjust the significance test threshold
    algorithmParameter: {
      outlier: {
        threshold: 0.05,
      },
    },
  }
});
```
