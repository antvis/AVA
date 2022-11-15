---
title: ChartAdvisor Types
order: 3
---

<embed src='@/docs/common/style.md'></embed>
### Advice

Single chart-recommandation from advisor.

```ts
interface Advice {
  type: string;
  spec: Specification | null;
  score: number;
  lint?: Lint[];
}
```

| Properties | Type                                                         | Optional | Examples     | Description                                                                                                                                                                    |
| ---------- | ------------------------------------------------------------ | :------: | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| type       | string                                                       |          | 'line_chart' | Chart Type: should be standard CKB ChartID or any string id for customized chart.                                                                                              |
| spec       | [Specification](../types/0_AVA#specification) <br /> \| null |          |              | For the recommended chart, the specification information needs to be declared, which may be antv-spec or custom spec (for indicator cards and cross tabs).                     |
| score      | number                                                       |          | 0.98         | A score summarised by rule scoring, which measures how well an individual chart is recommended in a recommendation scenario. The higher the score, the more recommended it is. |
| lint       | [Lint](#lint)[]                                              |    ?     |              | Lint array: problems that remain after the recommendation, with possible solutions accordingly.                                                                                |

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

Describe a chart recommandation problem.

```ts
interface Lint {
  type: string;
  id: string;
  score: number;
  fix?: any;
  docs?: any;
}
```

| Properties | Type                  | Optional | Examples       | Description                                                                  |
| ---------- | --------------------- | :------: | -------------- | ---------------------------------------------------------------------------- |
| type       | [RuleType](#ruletype) |          | 'HARD'         | Which type of rule does this issue violate.                                  |
| id         | string                |          | 'limit-series' | Id of the violated rule: standard ruleId or any string for custom rules.     |
| score      | number                |          | 0              | Score of this linting.                                                       |
| fix        | object                |    ?     |                | A part of Specification for overwriting the origin spec to solve this issue. |
| docs       | object                |    ?     |                | Explanation about this lint.                                                 |

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

Types of rules.

```ts
type RuleType = 'HARD' | 'SOFT' | 'DESIGN';
```

* HARD: If any of the hard rules are broken, the corresponding chart may not be drawn.
* SOFT: Violations of soft rules can leave the chart with design flaws, and the more soft rules are violated, the worse the chart quality.
* DESIGN: Design rules optimise the details of the configuration for charts whose type and encoding have already been determined.

### ScoringResultForChartType

Summary log of checking all rules for a single chart type.

```ts
interface ScoringResultForChartType {
  chartType: string;
  score: number;
  log?: ScoringResultForRule[];
}
```

| Properties | Type                                            | Optional | Examples     | Description                                                                   |
| ---------- | ----------------------------------------------- | :------: | ------------ | ----------------------------------------------------------------------------- |
| chartType  | string                                          |          | 'line_chart' | Scoring for this chart type: standard ChartId or any string for custom chart. |
| score      | number                                          |          | 0.98         | Final score.                                                                  |
| log        | [ScoringResultForRule](#scoringresultforrule)[] |    ?     |              | Whole records of scoring.                                                     |

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

Log for scoring a single rule.

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

| Properties | Type                  | Optional | Examples       | Description                                            |
| ---------- | --------------------- | :------: | -------------- | ------------------------------------------------------ |
| phase      | 'ADVISE' \| 'LINT'    |          | 'ADVISE'       | In what phase(advise\|lint) the rule was checked.      |
| ruleId     | string                |          | 'limit-series' | Standard ChartRuleId or any string id for custom rule. |
| score      | number                |          | 0.4            | Scoring result for this rule, score = base * weight.   |
| base       | number                |          | 0.8            | Scoring from validator.                                |
| weight     | number                |          | 0.5            | Weight of this rule.                                   |
| ruleType   | [RuleType](#ruletype) |          | 'SOFT'         | Type of this rule.                                     |

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
