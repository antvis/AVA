---
title: DataWizard 简介
order: 0
---

`markdown:docs/common/style.md`

<div class="doc-md">

DataWizard 是一个 js/ts 的前端数据处理类库。在 AVA 的框架中，它被用来“理解”输入端的数据集。不过，它也可以独立地被用来开发一些数学统计、数据模拟之类的功能。


## 特性

### 数据集分析

DataWizard 的 `analyzer` 模块可以从一个数据集样本中提取出各个字段的信息。这些信息包括字段的**特征**（字段名称、数据类型、统计信息，等）和**性质**（连续性、离散性，等），以及多字段间的**字段间关系**（相关性、周期性，等）。

简而言之，DataWizard 可以帮助你了解一个数据集。这也是我们做数据分析、智能可视化等工作的前提。

### 数据模拟

DataWizard 的 `random` 模块提供了非常丰富的模拟数据生成能力。你可以用它来快速开发一些数据模拟或自动填充类的功能。比如蚂蚁集团的设计工程化插件 <img src="https://gw.alipayobjects.com/zos/rmsportal/LFooOLwmxGLsltmUjTAP.svg" width="18"> [Kitchen](https://kitchen.alipay.com/) 中的自动填充功能。

<div align="center">
<img src="https://gw.alipayobjects.com/zos/antfincdn/6gRaznRUDU/kitchendatamockcn.png" width="600" />
</div>

## 安装

```bash
$ npm install @antv/data-wizard
```

## 用法

### analyzer

```js
import { analyzer }  from '@antv/data-wizard';

const a = [1, 2, 3];

const info = analyzer.analyzeField(a);

// 数据集的信息：
// {
//   "count": 3,
//   "distinct": 3,
//   "type": "integer",
//   "recommendation": "integer",
//   "missing": 0,
//   "samples": [1, 2, 3],
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

// 随机生成的名称，比如：
// Julian Brady, Louise Gonzales, Polly Maxwell...
```

</div>
