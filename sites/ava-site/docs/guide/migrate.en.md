---
title: Migrate
order: 9
---

## From v1 to v2

AVA a suite of intelligent visualization solutions, has released the following related capabilities in v1.
- `@antv/knowledge` A chart knowledge base for declaring the information underlying the chart;
- `@antv/dw-*` series, for data processing;
- `@antv/chart-advisor` Chart recommendations;
- `@antv/chart-linter` Chart optimization;

With the reorganization of the architecture, AVA internal capabilities were reorganized and upgraded v2.

### Change packages

- `@antv/knowledge` changed to `@antv/ckb`, basic usage remains the same;
- `@antv/dw-*` series, including `@antv/dw-analyzer`、`@antv/dw-transform`、`@antv/dw-random` and `@antv/dw-util` uniform as `@antv/data-wizard`. The api has also been updated, see the api changes below for details.

### Deprecated packages

- `@antv/chart-linter` that is no longer maintained, it's capability integration into `@antv/chart-advisor`.

### api change

#### `@antv/chart-advisor`

`autoChart` is deprecated and can use the original autoChart capable react component via `@antv/auto-chart`.

The original `autoChart` method is not only the assembly of the chart recommendation process, but also a lot of operation dom content, which is more suitable to be exposed as an independent component or application.

Import method:

```
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

### `@antv/dw-*`

<!-- TODO @pdd -->

### New

- `@antv/auto-chart` Automatic chart recommendation react component;
- `@antv/lite-insight` For front-end light insight;
- `@antv/smart-board` Automated dashboard;
- `@antv/smart-color` A library of intelligent color swatches.

