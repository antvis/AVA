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

## 📖 Documentation

For more usages, please check the [API Reference](../../api/insight/auto-insights).


## 🧷 Acknowledgement

Some functionalities of insight are inspired by the following works.

* [Extracting Top-K Insights from Multi-dimensional Data](https://www.microsoft.com/en-us/research/uploads/prod/2017/02/Insights_SIGMOD17.pdf)


* [MetaInsight: Automatic Discovery of Structured Knowledge for Exploratory Data Analysis](https://www.microsoft.com/en-us/research/uploads/prod/2021/03/rdm337-maA.pdf)



