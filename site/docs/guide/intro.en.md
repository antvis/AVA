---
title: AVA Introduction
order: 0
redirect_from:
  - /en/docs/guide
---

<div align="center">
  <img width="200" height="120" src="http://alipay-rmsdeploy-image.cn-hangzhou.alipay.aliyun-inc.com/antfincdn/9LkQDJaV%24%24/logo.svg" alt="AVA logo">
</div>

<div align="center">

<i>A framework for automated visual analytics.</i>

</div>

----

<a href="https://ava.antv.antgroup.com"><img src="https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*rXVYRJ0EMDsAAAAAAAAAAAAADmJ7AQ/original" align="left" hspace="10" vspace="6" width="160"></a>

**AVA** is a framework (or a solution) for more convenient **Visual Analytics**. The first **A** of AVA  has many meanings. It states that this framework is from *Alibaba*, and its goal is to become an *Automated*, *AI driven* solution that supports *Augmented* analytics.

<br />

The framework of AVA can be illustrated as follows:

<div align="center">
<img src='https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*ZINwQ6ubADQAAAAAAAAAAAAADmJ7AQ/original' width="100%" alt='AVA framework' />
</div>

<br />

## Demo

```jsx
import { getInsights } from '@antv/ava'
import { InsightCard } from '@antv/ava-react';

const data = [
  { year: '2000', value: 1 },
  { year: '2001', value: -1 },
  { year: '2002', value: 2 },
  { year: '2003', value: -2 },
  { year: '2004', value: 7 },
  { year: '2005', value: 3 },
  { year: '2006', value: -3 },
  { year: '2007', value: 0 },
  { year: '2008', value: 0 },
  { year: '2009', value: 1 },
]

const insightInfo = getInsights(data).insights[0]

ReactDOM.render(
  <>
    <InsightCard insightInfo={insightInfo} visualizationOptions={{ lang: 'en-US' }} />
  </>,
  mountNode,
);
```

<br>

<!-- <Playground path="components/auto-chart/demo/basic.jsx"></playground> -->
<!-- FIXME: 关联 insightcard 一类的 demo -->


## [@antv/ava](https://www.npmjs.com/package/@antv/ava)

`@antv/ava` is the core JS npm package of AVA. These are its key modules:

### advisor (chart recommendation)

> The original ChartAdvisor package `@antv/chart-advisor`

`advisor` is the core part of AVA. It recommends charts based on dataset and analysis needs. It also lints exist chart-spec.

Its core API includes:

```js
Advisor.advise() // chart recommendation
Advisor.lint() // chart linting
```

Basic usage:

```js
import { Advisor } from '@antv/ava';

const myAdvisor = new Advisor();

// chart recommendation
const data = [{ tax: 100, tag: 'A' }, { tax: 200, tag: 'B' }];
const results = myAdvisor.advise({ data });

// chart linting
const spec = { someAntVSpec }; // check G2 v5 chart specification
const errors = myAdvisor.lint({ spec });
```

### ckb (chart knowledge base)

> The original CKB package `@antv/ckb`、`@antv/knowledge`

CKB stands for Chart Knowledge Base.
It's the KB where empirical knowledge about visualization and charts is stored. AVA's chart recommendation is based on it.

At the same time, CKB also facilitates us to develop products of chart type selection.

Basic usage:

```js
import { ckb } from '@antv/ava';

const myCkb = ckb();
// the structure in myCkb can then be read on demand
```

### data (data processing)

> The original DataWizard package `@antv/data-wizard`

The module `data` is for data processing in the AVA framework, it is used to understand and process the input dataset.
Moreover, it can also be used independently to develop some data processing or statistics functions.


Its core API includes:

```js
DataFrame.info()
```

Basic usage:

```js
import { DataFrame } from '@antv/ava';

const df = new DataFrame([{ a: 1, b: 4 }, { a: 2, b: 5 }]);
const infos = df.info();
// the structure of infos will contain various statistical information about the dataset
```

### insight (auto insights)

> The original LiteInsight package `@antv/lite-insight`

The `insight` module can automatically discover data insights from multidimensional data.

Its core API includes:

```js
getInsights()
```

Basic usage:

```js
import { getInsights } from '@antv/ava';

const data = [{ tax: 100, tag: 'A' }, { tax: 200, tag: 'B' }];
const insights = getInsights(data);
```

## [@antv/ava-react](https://www.npmjs.com/package/@antv/ava-react)

`@antv/ava-react` is a plug-and-play React component library based on the integration of AVA capabilities.

### \<NarrativeTextVis /\>

The `ntv` module is used to display data insights in narrative text. Contains the ntv-schema types, such as `NarrativeTextSpec`, related spec declaration in `@antv/ava` and a react component `NarrativeTextVis` in `@antv/ava-react`.

Basic usage:

```jsx
import { NarrativeTextVis } from '@antv/ava-react';

export default () => {
  // textSpec in NarrativeTextSpec
  return <NarrativeTextVis spec={textSpec} />
}
```


### \<InsightCard /\>
`InsightCard` is a React Component that displays data insights using visualization and explanation. It can receive a specified type of insight result data, visualize and interpret the result, or directly receive data and automatically perform insight.

```jsx
import { NarrativeTextVis } from '@antv/ava-react';

export default () => { 
  return <InsightCard insightInfo={insightInfo} />
}
```

### \<AutoChart /\>

AutoChart is a React component that automatically suggests and renders the right chart based on data.
It can automatically generate and render the proper chart for visualization based on the input data with one-line of code.

> Please look out for further updates to the AutoChart component in future versions.
