---
title: Advisor.adviseWithLog
order: 12
---

<embed src='@/docs/common/style.md'></embed>

```sign
Advisor.adviseWithLog(): AdviseResult
```

## 参数

* **params** * Advisor 配置项
  * _必选参数_
  * `参数类型`: AdviseParams 对象

```ts
type AdviseParams = ChartAdviseParams;
```

其中，`ChartAdviseParams` 代表图表推荐所需要的参数类型。

### 统计图表推荐参数

* _**ChartAdviseParams**_ 参数配置。

| 属性         | 类型                | 描述                 | 默认值          |
| ------------ | ------------------- | -------------------- | --------------- |
| data         | `any[]`             | 源数据。             | 无              |
| fields       | `string[]`          | 数据字段信息。       | 无  `可选`      |
| smartColor   | `boolean`           | 是否开启智能配色。   | `false`  `可选` |
| options      | `AdvisorOptions`    | 统计图表推荐配置项。 | 无  `可选`      |
| colorOptions | `SmartColorOptions` | 智能配色配置项。     | 无  `可选`      |

* _**AdvisorOptions**_ 参数配置。

| 属性        | 类型          | 描述                         | 默认值     |
| ----------- | ------------- | ---------------------------- | ---------- |
| purpose     | `Purpose`     | 分析目的。                   | 无  `可选` |
| preferences | `Preferences` | 图表喜好。                   | 无  `可选` |
| refine      | `boolean`     | 是否开启可视化规则优化。     | 无  `可选` |
| fields      | `string[]`    | 数据字段信息。               | 无  `可选` |
| theme       | `Theme`       | 指定十六进制颜色。           | 无  `可选` |
| requireSpec | `boolean`     | 是否只推荐有 spec 结果的建议 | true       |

* _**Purpose**_ 参数配置。

```ts
type PURPOSE_OPTIONS = ["Comparison", "Trend", "Distribution", "Rank", "Proportion", 
  "Composition", "Relation", "Hierarchy", "Flow", "Spatial", "Anomaly", "Value"];
```

* _**Preferences**_ 参数配置。

```ts
interface Preferences {
  canvasLayout: 'landscape' | 'portrait';
}
```

* _**Theme**_ 参数配置。

```ts
type Theme = {
  primaryColor?: string;
};
```

* _**SmartColorOptions**_ 参数配置。

```ts
type SmartColorOptions = {
  themeColor?: string;
  colorSchemeType?: ColorSchemeType;
  simulationType?: SimulationType;
}
```

| 属性            | 类型              | 描述             | 默认值                  |
| --------------- | ----------------- | ---------------- | ----------------------- |
| themeColor      | `string`          | 十六进制主题色。 | `#006f94`  `可选`       |
| colorSchemeType | `ColorSchemeType` | 色板生成模式。   | `monochromatic`  `可选` |
| simulationType  | `SimulationType`  | 颜色模拟模式。   | `normal`  `可选`        |

`Advisor.adviseWithLog` 方法 需要用在 [Advisor.advise](./Advisor-advise) 方法之后，用于获取推荐过程中的打分细节，方便在应用中进行后续的解释。

## 返回值

```ts
type AdviseResult = {
  advices: Advice[];
  log: ScoringResultForChartType[];
};
```

_`Advice[]`_ 

* _**Advice**_ 参数配置。

| 属性  | 类型        | 描述           | 样例         |
| ----- | ----------- | -------------- | ------------ |
| type  | `ChartType` | 图表类型。     | `line-chart` |
| spec  | `AntVSpec`  | 图表属性信息。 | 见下文       |
| score | `number`    | 图表得分。     | `1.0`        |

* _**AntVSpec**_ 参数配置。

`AntVSpec` 是 AntV 技术栈的声明式语法。


| 属性  | 描述       | 样例                                                              |
| ----- | ---------- | ----------------------------------------------------------------- |
| basis | 基础信息。 | `basis: { type: 'chart' }`                                        |
| data  | 数据信息。 | `data: { type: 'json-array', values: [...] }`                     |
| layer | 绘制信息。 | `{ [ encoding: { x: {...}, y:{...} }, mark: { type: 'line' } ] }` |

_`AdviseLog`_

```ts
log: ScoringResultForChartType[];
```

* _**AdviseLog**_ 参数配置。

| 属性    | 类型                                                                             | 可选  | 示例 | 描述                                         |
| ------- | -------------------------------------------------------------------------------- | :---: | ---- | -------------------------------------------- |
| log     | ScoringResultForChartType[] |       |      | 所有图表的汇总打分记录。                     |

## 示例

```ts
import { Advisor } from '@antv/ava';

const data = [
  { f1: 'a', f2: 10 },
  { f1: 'b', f2: 20 },
  { f1: 'c', f2: 30 },
];

const myAdvisor = new Advisor();
const adviseResult = myAdvisor.adviseWithLog({data});
console.log(adviseResult.log);
```
