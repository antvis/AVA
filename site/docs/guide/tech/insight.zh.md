---
title: 自动洞察(insight)
order: 3
redirect_from:
  - /zh/docs/guide/tech/insight
---

从多维数据中自动地发现数据洞察。


## ✨ 功能特性

* **自动洞察**: 自动检测并突出显示数据中的洞察，以促进数据分析过程中的模式发现。
* **可视化 & 注释**: 直观地向非专业分析人员展示和传达数据中地洞察发现。
* **共性/例外模式**: 挖掘不同数据模式之间存在的共性和差异。

自动洞察的流程如下：

<img src='https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*es5sSYS6XIUAAAAAAAAAAAAADmJ7AQ/original' alt='LiteInsight pipeline' width=100%/>

## 🔨 使用

### getInsights 使用

`getInsights` 方法用于从多维数据中运行不同算法来发现数据中有趣的模式，并将不同类型的模式进行统一评估，按照分数返回高质量的数据洞察结果。输入输出参数详见 [getInsights API](../../api/insight/auto-insights.zh.md)。


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

通过配置 ***insightTypes*** 属性指定计算的洞察类型，具体内容详见 [getInsights API](../../api/insight/auto-insights.zh.md)。

```ts
import { getInsights } from '@antv/ava';

getInsights(data, {
  limit: 30,
  insightTypes: ['trend', 'time_series_outlier']
});
```

使用 ***impactMeasures*** 和 ***impactWeight*** 属性来自定义影响力指标和权重。

```ts
import { getInsights } from '@antv/ava';

getInsights(data, {
  limit: 10,
  // 自定义影响力（Impact）分数的计算指标
  impactMeasures: [
    { fieldName: 'life_expect', method: 'COUNT' },
    { fieldName: 'pop', method: 'COUNT' },
    { fieldName: 'fertility', method: 'COUNT' },
  ],
  // 自定义影响力（Impact）分数在洞察分数中的权重（0 ~ 1）
  impactWeight: 0.5,
});
```


### insightPatternsExtractor 使用

如果只想获取指定类型的洞察结果，那么`insightPatternsExtractor`将是你的首选。输入输出参数详见 [insightPatternsExtractor API](../../api/insight/insight-patterns-extractor.zh.md)。


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

`getSpecificInsight`方法不仅能获取指定类型的洞察结果，还能输出可视化spec，结合`InsightCard`组件就能通过可视化的方式呈现指定类型的洞察结果。输入输出参数详见 [getSpecificInsight API](../../api/insight/get-specific-insight.zh.md)。


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

## 📖 文档

更多用法请移步至 [API](../../api/insight/auto-insights)。

## 🧷 致谢

insight 其中的一些功能设计受到以下论文的启发：

* [Extracting Top-K Insights from Multi-dimensional Data](https://www.microsoft.com/en-us/research/uploads/prod/2017/02/Insights_SIGMOD17.pdf)


* [MetaInsight: Automatic Discovery of Structured Knowledge for Exploratory Data Analysis](https://www.microsoft.com/en-us/research/uploads/prod/2021/03/rdm337-maA.pdf)


