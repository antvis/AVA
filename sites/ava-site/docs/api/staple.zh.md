---
title: 常用 API
order: 0
redirect_from:
  - /zh/docs/api
---

`markdown:docs/common/style.md`

<div class="doc-md">

### autoChart

根据数据自动推荐合适的图表，并渲染在指定容器中。

```sign
autoChart(container, data, options);
```

* **container** * 图表所需要被放置的 DOM 容器。
  * _必要参数_
  * `参数类型`: HTMLElement

* **data** * 包含对象型数据行的数组.
  * _必要参数_
  * `参数类型`: any[] | Promise<any[]>

* **options** * 自定义选项。
  * _可选参数_
  * `参数类型`: AutoChartOptions

```html
<div id="mountNode"></div>
```

```js
import { autoChart } from '@antv/chart-advisor';

const container = document.getElementById('mountNode');

const data = [
  {field1: 'a', field2: '100'},
  {field1: 'b', field2: '300'},
  {field1: 'c', field2: '800'},
];

autoChart(container, data, {toolbar: true, development: true});
```

### type


对单字段数据进行分析。

字段类型只有 `string`、 `float`、 `integer`、 `boolean`、 `date`、 `null` 几种。

```sign
type(array)
```

* **array** * 一个包含字段所有的值的数组。
  * _必要参数_
  * `参数类型`: any[]

```ts
import { analyzer } from '@antv/data-wizard';

const data = [1, 2, 3, 4, 5];

const fieldInfo = analyzer.analyzeField(data);

console.log(fieldInfo);

// {
//   "count": 5, // 行数
//   "distinct": 5, //
//   "type": "integer",
//   "recommendation": "integer", // 推荐类型
//   "missing": 0,
//   "rawData": [ 1, 2, ... ],
//   "valueMap": { "1": 1, "2": 1, "3": 1, "4": 1, "5": 1 },
//   "minimum": 1,
//   "maximum": 5,
//   "mean": 3,
//   "percentile5": 1,
//   "percentile25": 2,
//   "percentile50": 3,
//   "percentile75": 4,
//   "percentile95": 5,
//   "sum": 15,
//   "standardDeviation": 1.4142135623730951, //标准差
//   "variance": 2, // 方差
//   "zeros": 0
// }
```

</div>
