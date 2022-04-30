---
title: ChartAdvisor 相关类型
order: 3
---

`markdown:docs/common/style.md`

### Advice

推荐建议：有图表推荐过程得出的某一个结果，针对一种图表类型。

```ts
interface Advice {
  type: string;
  spec: Specification | null;
  score: number;
  lint?: Lint[];
}
```

| 属性  | 类型                                                         | 可选  | 示例         | 描述                                                                         |
| ----- | ------------------------------------------------------------ | :---: | ------------ | ---------------------------------------------------------------------------- |
| type  | string                                                       |       | 'line_chart' | 图表类型：一般是标准的 ChartId，也如果是自定义的图表类型也可以是任何字符串。 |
| spec  | [Specification](../types/0_AVA#specification) <br /> \| null |       |              | 对图表结果的声明式描述 schema。                                              |
| score | number                                                       |       | 0.98         | 该图表类型在此次推荐中的综合得分。                                           |
| lint  | [Lint](#lint)[]                                              |   ?   |              | 该推荐结果仍然存在的问题描述，可能会附带提供对应解决方案。                   |

**<font size=4>Examples</font>**

```json
{
  type: 'pie_chart',
  spec: {
    basis: {
      type: 'chart',
    },
    data: {
      type: 'json-array',
      values: [
        { price: 100, type: 'A' },
        { price: 120, type: 'B' },
        { price: 150, type: 'C' },
      ],
    },
    layer: [
      {
        mark: { type: 'arc' },
        encoding: {
          theta: { field: 'price', type: 'quantitative' },
          color: { field: 'type', type: 'nominal' },
        },
      },
    ],
  },
  score: 1.5535986680617797,
  lint: [
    {
      type: 'SOFT',
      id: 'diff-pie-sector',
      score: 0.0405306694568926,
      docs: {
        lintText: 'The difference between sectors of a pie chart should be large enough.',
      },
    },
    {
      type: 'SOFT',
      id: 'series-qty-limit',
      score: 0.6666666666666666,
      docs: {
        lintText: 'Some charts should has at most N values for the series.',
      },
    },
  ],
}
```

### Lint

表述图表中存在的问题。

```ts
interface Lint {
  type: string;
  id: string;
  score: number;
  fix?: any;
  docs?: any;
}
```

| 属性  | 类型                  | 可选  | 示例           | 描述                                                                   |
| ----- | --------------------- | :---: | -------------- | ---------------------------------------------------------------------- |
| type  | [RuleType](#ruletype) |       | 'HARD'         | 当前问题违反了哪一类规则。                                             |
| id    | string                |       | 'limit-series' | 所违反规则的 ID：通常是标准的 RuleId，对于自定义规则可以是任何字符串。 |
| score | number                |       | 0              | 违反程度的打分，0 最低。                                               |
| fix   | object                |   ?   |                | 一部分 Specification，可以用来覆盖掉原本的部分，来自动修复问题。       |
| docs  | object                |   ?   |                | 对此次问题、相关规则、解决方案的描述解释。                             |

**<font size=4>Examples</font>**

```json
{
  type: 'DESIGN',
  id: 'bar-without-axis-min',
  score: 0,
  fix: {
    layer: [
      {
        mark: { type: 'bar' },
        encoding: {
          x: { field: 'type', type: 'nominal' },
          y: {
            field: 'sales',
            type: 'quantitative',
            axis: {
              min: 0,
            },
          },
        },
      },
    ],
  },
  docs: {
    lintText: 'It is not recommended to set the minimum value of axis for the bar or column chart.',
    fixText: 'Remove the minimum value config of axis.',
  },
}
```

### RuleType

规则的不同类型。

```ts
type RuleType = 'HARD' | 'SOFT' | 'DESIGN';
```

* HARD: 违反任何一条强规则，将导致相应的图表根本无法被绘制出来。
* SOFT: 违反弱规则会让图表存在设计缺陷，违反弱规则越多，图表质量越差。
* DESIGN: 设计规则针对的是已经确定了类型和 encoding 的图表，去优化其细节配置项。

### ScoringResultForChartType

给某一个图表类型打分后的汇总记录 Log。

```ts
interface ScoringResultForChartType {
  chartType: string;
  score: number;
  log?: ScoringResultForRule[];
}
```

| 属性      | 类型                                            | 可选  | 示例         | 描述           |
| --------- | ----------------------------------------------- | :---: | ------------ | -------------- |
| chartType | string                                          |       | 'line_chart' | 对应图表类型。 |
| score     | number                                          |       | 0.98         | 综合得分。     |
| log       | [ScoringResultForRule](#scoringresultforrule)[] |   ?   |              | 汇总记录。     |

**<font size=4>Examples</font>**

```json
{
  chartType: 'pie_chart',
  score: 0,
  log: [
    { phase: 'ADVISE', ruleId: 'data-check', score: 0, base: 0, weight: 1, ruleType: 'HARD' },
    { phase: 'ADVISE', ruleId: 'data-field-qty', score: 1, base: 1, weight: 1, ruleType: 'HARD' },
    { phase: 'ADVISE', ruleId: 'no-redundant-field', score: 1, base: 1, weight: 1, ruleType: 'HARD' },
    { phase: 'ADVISE', ruleId: 'purpose-check', score: 1, base: 1, weight: 1, ruleType: 'HARD' },
    {
      phase: 'ADVISE',
      ruleId: 'diff-pie-sector',
      score: 0.17592592592592599,
      base: 0.35185185185185197,
      weight: 0.5,
      ruleType: 'SOFT',
    },
    { phase: 'ADVISE', ruleId: 'series-qty-limit', score: 0, base: 0, weight: 0.8, ruleType: 'SOFT' },
  ],
}
```

### ScoringResultForRule

某一条规则打分后留下的记录 log。

```ts
interface ScoringResultForRule {
  phase: 'ADVISE' | 'LINT';
  ruleId: string;
  score: number;
  base: number;
  weight: number;
  ruleType: RuleType;
}
```

| 属性     | 类型                  | 可选  | 示例           | 描述                                                             |
| -------- | --------------------- | :---: | -------------- | ---------------------------------------------------------------- |
| phase    | 'ADVISE' \| 'LINT'    |       | 'ADVISE'       | 这条打分记录是在哪个阶段生成的。                                 |
| ruleId   | string                |       | 'limit-series' | 对应规则的 ID，通常是标准 RuleId，针对定制规则可以是任何字符串。 |
| score    | number                |       | 0.4            | 综合得分 score = base * weight                                   |
| base     | number                |       | 0.8            | 验证函数计算出的基础得分。                                       |
| weight   | number                |       | 0.5            | 这条规则的权重。                                                 |
| ruleType | [RuleType](#ruletype) |       | 'SOFT'         | 这条规则的类型。                                                 |

**<font size=4>Examples</font>**

```json
{
  phase: 'ADVISE',
  ruleId: 'diff-pie-sector',
  score: 0.17592592592592599,
  base: 0.35185185185185197,
  weight: 0.5,
  ruleType: 'SOFT',
}
```
