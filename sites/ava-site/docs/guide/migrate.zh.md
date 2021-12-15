---
title: 升级指引
order: 9
---

## 从 v1 升级到 v2

AVA 作为一套智能可视化解决方案，在 v1 版本中发布了以下相关能力：
- `@antv/knowledge` 图表知识库，用于声明图表基础信息；
- `@antv/dw-*` 系列，用于数据处理；
- `@antv/chart-advisor` 图表推荐；
- `@antv/chart-linter` 图表优化；

随着对架构的重新梳理，AVA 内部能力重新整合升级 v2。

### 变更包

- `@antv/knowledge` 更名为 `@antv/ckb`，基本使用不变；
- `@antv/dw-*` 系列（包括 `@antv/dw-analyzer`、`@antv/dw-transform`、`@antv/dw-random`、`@antv/dw-util`）统一为 `@antv/data-wizard`，api 也有升级，详情见下方 api 变更内容；

### 废弃包

- `@antv/chart-linter` 能力整合进入 `@antv/chart-advisor`，该包不再维护；

### api 变更

#### `@antv/chart-advisor`

`autoChart` 废弃，可以通过 `@antv/auto-chart` 使用原 autoChart 能力的 react 组件；

引用方式：

```
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



### `@antv/dw-*`

<!-- TODO @pdd -->

### 新增包

- `@antv/auto-chart` 自动图表推荐绘图 react 组件；
- `@antv/lite-insight` 用于前端轻洞察；
- `@antv/smart-board` 自动生成 dashboard；
- `@antv/smart-color` 智能色板库；

