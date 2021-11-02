---
title: Introduction to DataWizard
order: 0
---

`markdown:docs/common/style.md`

<div class="doc-md">

DataWizard is a js/ts library for data processing. In the AVA framework, it is used to 'understand' the input dataset. However, it can also be used independently to develop some statistical or data mocking functions.

## Features

### Dataset Analysis

DataWizard can help you extract information of fields from a dataset sample by its `analyzer` module. The information includes the field's **characteristics** (field name, data type, statistics, etc.) and **properties** (continuity, discreteness, etc.), as well as **field-to-field relationships** (correlation, periodicity, etc.).

In short, DataWizard can help you understand a dataset. This is the premise of data analysis and Automatic chart recommendation.

### Data Mocking

The `random` module of DataWizard provides you comprehensive data mocking options. You can use it to quickly develop some data generating or auto-filling functions. For example, the auto-fill function in the desgin engineering plugin <img src="https://gw.alipayobjects.com/zos/rmsportal/LFooOLwmxGLsltmUjTAP.svg" width="18"> [Kitchen](https://kitchen.alipay.com/) 

<div align="center">
<img src="https://gw.alipayobjects.com/zos/antfincdn/r4gEasYXD%24/kitchendatamocken.png" width="600" />
</div>

## Installation

```bash
$ npm install @antv/data-wizard
```

## Usage

### analyzer

```js
import { analyzer }  from '@antv/data-wizard';

const a = [1, 2, 3];

const info = analyzer.analyzeField(a);

// the info of the dataset:
// {
//   "count": 3,
//   "distinct": 3,
//   "type": "integer",
//   "recommendation": "integer",
//   "missing": 0,
//   "rawData": [1, 2, 3],
//   "valueMap": {"1": 1, "2": 1, "3": 1},
//   "minimum": 1,
//   "maximum": 3,
//   "mean": 2,
//   "percentile5": 1,
//   "percentile25": 1,
//   "percentile50": 2,
//   "percentile75": 3,
//   "percentile95": 3,
//   "sum": 6,
//   "variance": 0.6666666666666666,
//   "standardDeviation": 0.816496580927726,
//   "zeros": 0
// }
```

### random

```js
import { random } from '@antv/data-wizard';

const name = random.name();

// some random name such as:
// Julian Brady, Louise Gonzales, Polly Maxwell...
```

</div>
