---
title: Staple API
order: 0
redirect_from:
  - /en/docs/api
---

`markdown:docs/common/style.md`

<div class="doc-md">

### autoChart

Recommand appropriate charts for your data and generate it for you.

```sign
autoChart(container, data, options);
```

* **container** * DOM where your chart will be drawn.
  * _required_
  * `type`: HTMLElement

* **data** * Row data array.
  * _required_
  * `type`: any[] | Promise<any[]>

* **options** * Options.
  * _optional_
  * `type`: AutoChartOptions


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

Analyze one field(data column).

Field Type is one of `string`, `float`, `integer`, `boolean`, `date`, `null`.

```sign
type(array)
```

* **array** * An array contains values in a data field(column).
  * _required_
  * `type`: any[]


```ts
import { type } from '@antv/dw-analyzer';

const data = [1, 2, 3, 4, 5];

const fieldInfo = type(data);

console.log(fieldInfo);

// {
//   "count": 5, // rows
//   "distinct": 5,
//   "type": "integer",
//   "recommendation": "integer",
//   "missing": 0,
//   "samples": [ 1, 2, ... ],
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
//   "stdev": 1.4142135623730951,
//   "variance": 2,
//   "zeros": 0
// }
```

</div>
