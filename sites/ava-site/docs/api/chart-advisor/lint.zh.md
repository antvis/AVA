---
title: Linter.lint
order: 6
---

`markdown:docs/common/style.md`

<div class='doc-md'>

```sign
Linter.lint(params: LintParams): Lint[];
```

### 参数

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

其中，`spec`、`dataProps` 和 `options` 分别代表输入图表的语法、图标推荐配置项和 Linter 配置项。

#### 图表优化参数

* ***AntVSpec*** 参数配置。

```ts
type AntVSpec = {
  basis: { 
    type: string;
  };
  data: { 
    type: string;
    values: [];
  };
  layer: [
    { 
      encoding;
      mark;
      ...
    }
  ];
};
```

| 属性 | 描述 | 样例 |  
| ----| ---- | -----|
| basis | 基础信息。 | `basis: { type: 'chart' }` |
| data | 数据信息。 | `data: { type: 'json-array', values: [...] }` |
| layer | 绘制信息。 | `{ [ encoding: { x: {...}, y:{...} }, mark: { type: 'line' } ] }` |

`AntVSpec` 是 AntV 技术栈的声明式语法。详细配置项见 [AntVSpec API](https://github.com/antvis/antv-spec/blob/master/API.md)。

* ***BasicDataPropertyForAdvice*** 参数配置。

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
  // for customized props
  [key: string]: any;
}
```

| 属性 | 类型 | 描述 | 默认值 |  
| ----| ---- | ---- | -----|
| name | `string` | 字段名。 | 无 |
| levelOfMeasurements | `LOM[]` | 测量尺度。 | 无 |
| rawData | `any[]` | 源数据。 | `false` |
| recommendation | `analyzer.FieldInfo['recommendation']` | 推荐类型。 | 无 |
| type | `analyzer.FieldInfo['type']` | 字段类型。 | 无 |
| distinct | `number` | 去重计数。 | 无 |
| count | `number` | 计数。 | 无 |
| sum | `number` | 总计。 | 无 |
| maximum | `any` | 最大值。 | 无 |
| minimum | `any` | 最小值。 | 无 |
| missing | `number` | 缺失值。 | 无 |
| [key] | `any` | 自定义属性。 | 无 |

* ***LOM*** 参数配置。

```ts
const LOM_OPTIONS: readonly ["Nominal", "Ordinal", "Interval", "Discrete", "Continuous", "Time"];
```

* ***recommendation*** 参数配置。

```ts
type RecommendationTypes = 'null' | 'boolean' | 'integer' | 'float' | 'date' | 'string' | 'mixed';
```

* ***type*** 参数配置。

```ts
type TypeSpecifics = RecommendationTypes | 'mixed';
```


* ***LinterOptions*** 参数配置。

```ts
type LinterOptions = {
  purpose?: Purpose;
  preferences?: Preferences;
};
```

| 属性 | 类型 | 描述 | 默认值 |  
| ----| ---- | ---- | -----|
| purpose | `Purpose` | 分析目的。 | 无 |
| preferences | `Preferences` | 图表喜好。 | 无 |

* ***Purpose*** 参数配置。

```ts
type PURPOSE_OPTIONS = [
  "Comparison", 
  "Trend", 
  "Distribution", 
  "Rank", 
  "Proportion", 
  "Composition", 
  "Relation", 
  "Hierarchy", 
  "Flow", 
  "Spatial", 
  "Anomaly", 
  "Value"
  ];
```

* ***Preferences*** 参数配置。

```ts
interface Preferences {
  canvasLayout: 'landscape' | 'portrait';
}
```


### 返回值

*`Lint[]`* 

* ***Lint*** 参数配置。

```ts
interface Lint {
  type: string;
  id: string;
  score: number;
  fix?: any;
  docs?: any;
}
```

| 属性 | 类型 | 描述 | 样例 |  
| ----| ---- | ---- | -----|
| type | `string` | 规则类型。 | `hard / soft / design` |
| id | `string` | 规则 id。 | `10` |
| score | `number` | 该规则的得分。 | `1` |
| fix | `any` | 基于该规则的解决方案。 |  |
| docs | `any` | 该规则的相关文档。 |  |


</div>
