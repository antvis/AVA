---
title: Introduction to insight
order: 0
---

<embed src='@/docs/common/style.md'></embed>


A module for automatically discovering interesting patterns from multi-dimensional data.

</div>

## ✨ Features

* **Auto-Insights**: Automatically detect and highlight the insights to facilitate pattern discovery about the data.
* **Visualization & Annotation**: Clearly represent and convey insights to non-expert users.
* **Homogeneous Data Patterns**: Extract the relations between different patterns.

The pipeline of Auto-Insights:

<img src='https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*mmGnTLk5JUsAAAAAAAAAAAAADmJ7AQ/original' alt='LiteInsight pipeline' width=100%/>

## 🔨 Usage

### getInsights Usage

The `getInsights` method runs different algorithms from multi-dimensional data to discover interesting patterns in the data, and perform unified evaluation of different types of patterns, and return high-quality data insights based on scores. Detailed input and output parameters are described in the [getInsights API](../../api/insight/auto-insight.en.md).


```ts
import { getInsights } from '@antv/ava';

getInsights(data, {
  limit: 30,
  measures: [
    { fieldName: 'life_expect', method: 'MEAN' },
    { fieldName: 'pop', method: 'SUM' },
    { fieldName: 'fertility', method: 'MEAN' },
  ]
});
```

Customize insight types by the  ***insightTypes*** attribute. Detailed parameters are described in the [getInsights API](../../api/insight/auto-insight.en.md).

```ts
import { getInsights } from '@antv/ava';

getInsights(data, {
  limit: 10,
  insightTypes: ['trend', 'time_series_outlier']
});
```

Customize impact measures and weights by setting up ***impactMeasures*** and  ***impactWeight***.

```ts
import { getInsights } from '@antv/ava';

getInsights(data, {
  limit: 10,
  // set the measures of the impact score
  impactMeasures: [
    { fieldName: 'life_expect', method: 'COUNT' },
    { fieldName: 'pop', method: 'COUNT' },
    { fieldName: 'fertility', method: 'COUNT' },
  ],
  // adjust the calculation weight of the relevant factors (significance, impact) 
  // in the calculation of the insight score.
  impactWeight: 0.5,
});
```

### insightPatternsExtractor Usage

If you only want to get insights of a specific type, `insightPatternsExtractor` will be your first choice. Detailed input and output parameters are described in the [insightPatternsExtractor API](../../api/insight/insight-patterns-extractor.en.md).


```ts
import { insightPatternsExtractor } from '@antv/ava';

insightPatternsExtractor({
  data,
  measures: [{ fieldName: 'life_expect', method: 'MEAN' }],
  dimensions: [{ fieldName: 'date' }],
  insightType: 'trend',
});
```

### getSpecificInsight 使用

The `getSpecificInsight` method can not only obtain the specified type of insight, but also output a visual spec. Combined with the `InsightCard` component, the insight results can be presented in a visual way. Input parameters are the same as the `insightPatternsExtractor` method. Detailed output parameters are described in the [InsightInfo API](../../api/insight/auto-insights.zh.md)。


```ts
import { getSpecificInsight } from '@antv/ava';

const insightResult = getSpecificInsight({
  data,
  measures: [{ fieldName: 'life_expect', method: 'MEAN' }],
  dimensions: [{ fieldName: 'date' }],
  insightType: 'trend',
});

<InsightCard insightInfo={insightResult}/>
```

## 📖 Documentation

For more usages, please check the [API Reference](../../api/insight/auto-insights).


## 🧷 Acknowledgement

Some functionalities of insight are inspired by the following works.

* [Extracting Top-K Insights from Multi-dimensional Data](https://www.microsoft.com/en-us/research/uploads/prod/2017/02/Insights_SIGMOD17.pdf)


* [MetaInsight: Automatic Discovery of Structured Knowledge for Exploratory Data Analysis](https://www.microsoft.com/en-us/research/uploads/prod/2021/03/rdm337-maA.pdf)



