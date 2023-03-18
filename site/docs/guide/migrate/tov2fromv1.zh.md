---
title: 从 v1 升级到 v2
order: 9
---

## 从 v1 升级到 v2

AVA 作为一套智能可视化解决方案，在 v1 版本中发布了以下相关能力：

* `@antv/knowledge` 图表知识库，用于声明图表基础信息；
* `@antv/dw-*` 系列，用于数据处理；
* `@antv/chart-advisor` 图表推荐；
* `@antv/chart-linter` 图表优化；

随着对架构的重新梳理，AVA 内部能力重新整合升级 v2。

### 变更包

* `@antv/knowledge` 更名为 `@antv/ckb`，基本使用不变；
* `@antv/dw-*` 系列（包括 `@antv/dw-analyzer`、`@antv/dw-random`、`@antv/dw-util`、`@antv/dw-transform`）统一为 `@antv/data-wizard`，api 也有升级，详情见下方 api 变更内容；

### 废弃包

* `@antv/chart-linter` 能力整合进入 `@antv/chart-advisor`，该包不再维护；

### api 变更

#### `@antv/chart-advisor`

`autoChart` 废弃，可以通过 `@antv/auto-chart` 使用原 autoChart 能力的 react 组件，原 `autoChart` 方法不只是对图表推荐流程的组装，还有很多操作 dom 的内容，相关能力更适合作为独立组件或者应用对外暴露，chart-advisor 将专注图表推荐流程及结果结构描述；

引用方式：

```js
// Before
import { autoChart } from '@antv/chart-advisor';
autoChart(container, data, options);

// After
import { AutoChart } from '@antv/auto-chart';
ReactDOM.render(<AutoChart data={data} {...options} />, container);
```

options 对应一览：

|  Before   | After |
|  ----  | ----  | 
| autoChart.title  | 对应 AutoChart props.title |
| autoChart.description  | 对应 AutoChart props.description |
| autoChart.toolbar  | 对应 AutoChart props.showRanking |
| autoChart.theme  | 暂不支持 |
| autoChart.config  | 暂不支持 |
| autoChart.noDataContent  | 对应 AutoChart props.noDataContent |
| autoChart.language  | 对应 AutoChart props.language |
| autoChart.development  | 废弃 |

`dataToDataProps` ...

<!-- TODO @龙朱 @pdd -->

#### `@antv/dw-*`

`@antv/dw-*` 系列的所有 `DataWizard` 相关包，整合为 `@antv/data-wizard`，可直接从统一包中获取所需方法，变更概述如下：

* `@antv/dw-analyzer` 变更为 `import { analyzer } from '@antv/data-wizard`，并新增 `import { DataFrame } from '@antv/data-wizard` 用于数据操作。
* `@antv/dw-random` 变更为 `import { random } from '@antv/data-wizard`。
* `@antv/dw-util` 变更为 `import { utils } from '@antv/data-wizard`。
* `@antv/dw-transform` 废弃，相关方法将融入 `DataFrame` 和 `utils`。
* 新增 `statistics` 方法，引用方式为 `import { statistics } from '@antv/data-wizard`。

引用方式举例：

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

详情使用方式可查看

* [DataFrame](../api/data-wizard/data-frame)
* [statistics](../api/data-wizard/statistics)
* [random](../api/data-wizard/random)

### 新增包

* `@antv/auto-chart` 自动图表推荐绘图 react 组件；
* `@antv/lite-insight` 用于前端轻洞察；
* `@antv/smart-board` 自动生成 dashboard；
* `@antv/smart-color` 智能色板库；

