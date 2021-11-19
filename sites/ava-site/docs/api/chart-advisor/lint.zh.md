---
title: Linter.lint
order: 6
---

`markdown:docs/common/style.md`



```sign
Linter.lint(params: LintParams): Lint[];
```

## 参数

* **params** * Linter 配置项
  * _必选参数_
  * `参数类型`: LintParams 对象

```ts
interface LintParams {
  spec: AntVSpec;
  dataProps?: BasicDataPropertyForAdvice[];
  options?: LinterOptions;
}
```

其中，`spec`、`dataProps` 和 `options` 分别代表输入图表的语法、图表推荐配置项和 Linter 配置项。

### 图表优化参数

* ***AntVSpec*** 参数配置。

`AntVSpec` 是 AntV 技术栈的声明式语法。
详细配置项见 [AntVSpec API](https://github.com/antvis/antv-spec/blob/master/API.md)。

| 属性 | 描述 | 样例 |  
| ----| ---- | -----|
| basis | 基础信息。 | `basis: { type: 'chart' }` |
| data | 数据信息。 | `data: { type: 'json-array', values: [...] }` |
| layer | 绘制信息。 | `{ [ encoding: { x: {...}, y:{...} }, mark: { type: 'line' } ] }` |

* ***BasicDataPropertyForAdvice*** 参数配置，详见 [Ruler](./Ruler)。

```ts
interface BasicDataPropertyForAdvice {
  /** field name */
  readonly name?: string;
  /** LOM */
  readonly levelOfMeasurements?: LOM[];
  /** used for split column xy series */
  readonly rawData: any[];
  /** required types in analyzer FieldInfo */
  readonly recommendation: analyzer.FieldInfo['recommendation'];
  readonly type: analyzer.FieldInfo['type'];
  readonly distinct?: number;
  readonly count?: number;
  readonly sum?: number;
  readonly maximum?: any;
  readonly minimum?: any;
  readonly missing?: number;
  // for  props
  [key: string]: any;
}
```

* ***LinterOptions*** 参数配置。

| 属性 | 类型 | 描述 | 默认值 |  
| ----| ---- | ---- | -----|
| purpose | `Purpose` | 分析目的。 | 无 `可选` |
| preferences | `Preferences` | 图表喜好。 | 无 `可选` |

* ***Purpose*** 参数配置。

```ts
type PURPOSE_OPTIONS = ["Comparison", "Trend", "Distribution", "Rank", "Proportion", 
  "Composition", "Relation", "Hierarchy", "Flow", "Spatial", "Anomaly", "Value"];
```

* ***Preferences*** 参数配置。

```ts
interface Preferences {
  canvasLayout: 'landscape' | 'portrait';
}
```

## 返回值

*`Lint[]`* 

* ***Lint*** 参数配置。

| 属性 | 类型 | 描述 | 样例 |  
| ----| ---- | ---- | -----|
| type | `string` | 规则类型。 | `hard / soft / design` |
| id | `string` | 规则 id。 | `10` |
| score | `number` | 该规则的得分。 | `1` |
| fix | `any` | 基于该规则的解决方案。 |  |
| docs | `any` | 该规则的相关文档。 |  |



