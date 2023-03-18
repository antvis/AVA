---
title: To v2 from v1
order: 9
---

## From v1 to v2

AVA a suite of intelligent visualization solutions, has released the following related capabilities in v1.

* `@antv/knowledge` A chart knowledge base for declaring the information underlying the chart;
* `@antv/dw-*` series, for data processing;
* `@antv/chart-advisor` Chart recommendations;
* `@antv/chart-linter` Chart optimization;

With the reorganization of the architecture, AVA internal capabilities were reorganized and upgraded v2.

### Change packages

* `@antv/knowledge` changed to `@antv/ckb`, basic usage remains the same;
* `@antv/dw-*` series, including `@antv/dw-analyzer`、`@antv/dw-transform`、`@antv/dw-random` and `@antv/dw-util` uniform as `@antv/data-wizard`. The api has also been updated, see the api changes below for details.

### Deprecated packages

* `@antv/chart-linter` that is no longer maintained, it's capability integration into `@antv/chart-advisor`.

### api change

#### `@antv/chart-advisor`

`autoChart` is deprecated and can use the original autoChart capable react component via `@antv/auto-chart`.

The original `autoChart` method is not only the assembly of the chart recommendation process, but also a lot of operation dom content, which is more suitable to be exposed as an independent component or application.

Import method:

```js
// Before
import { autoChart } from '@antv/chart-advisor';
autoChart(container, data, options);

// After
import { AutoChart } from '@antv/auto-chart';
ReactDOM.render(<AutoChart data={data} {...options} />, container);
```

options list:

|  Before   | After |
|  ----  | ----  | 
| autoChart.title  | as AutoChart props.title |
| autoChart.description  | as AutoChart props.description |
| autoChart.toolbar  | change to AutoChart props.showRanking |
| autoChart.theme  | not supported |
| autoChart.config  | not supported |
| autoChart.noDataContent  | as AutoChart props.noDataContent |
| autoChart.language  | as AutoChart props.language |
| autoChart.development  | deprecated |

`dataToDataProps` ...

<!-- TODO @龙朱 @pdd -->

#### `@antv/dw-*`

`DataWizard` related packages were integrated into `@antv/data-wizard`, and the methods could be imported directly from it. The changes are as follows:

* Use `import { analyzer } from '@antv/data-wizard` instead of `@antv/dw-analyzer`，and add `import { DataFrame } from '@antv/data-wizard` to support data manipulation.
* Use `import { random } from '@antv/data-wizard` instead of `@antv/dw-random`。
* Use `import { utils } from '@antv/data-wizard` instead of `@antv/dw-util`。
* `@antv/dw-transform` was deprecated，using `DataFrame` 和 `utils` instead of it。
* Add `statistics` by `import { statistics } from '@antv/data-wizard`。

Import method:

```js
// Before
import { type }  from '@antv/dw-analyzer';
const a = [1, 2, 3];
const info = type(a);

// After
import { DataFrame } from '@antv/data-wizard';
const df = new DataFrame([1, 2, 3]);
const info = df.info();
// or
import { analyzeField } from '@antv/data-wizard';
const a = [1, 2, 3];
const info = analyzeField(a);
```

More details: 

* [DataFrame](../api/data-wizard/data-frame)
* [statistics](../api/data-wizard/statistics)
* [random](../api/data-wizard/random)

### New

* `@antv/auto-chart` Automatic chart recommendation react component;
* `@antv/lite-insight` For front-end light insight;
* `@antv/smart-board` Automated dashboard;
* `@antv/smart-color` A library of intelligent color swatches.

