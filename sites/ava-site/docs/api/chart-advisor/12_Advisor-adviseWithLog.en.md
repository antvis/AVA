---
title: Advisor.adviseWithLog
order: 12
---

<embed src='@/docs/common/style.md'></embed>

```sign
Advisor.adviseWithLog(params: AdviseParams): AdvicesWithLog
```

The `Advisor.adviseWithLog` method does almost exactly the same thing as [Advisor.advise](./11_Advisor-advise) except that `Advisor.advanceWithLog` additionally returns the scoring details of the recommendation process for subsequent interpretation of the recommendation in any application.

## Parameters

* **params** Advisor configurations
  * _required_
  * `type`: AdviseParams

See [Advisor.advise](./10_Advisor#parameters).

## Return value

_`AdvicesWithLog`_

```ts
interface AdvicesWithLog {
  advices: Advice[];
  log: ScoringResultForChartType[];
}
```

* _**AdvicesWithLog**_ Parameter configuration.

| Properties | Type                                                                             | Optional | Examples | Description                                         |
| ---------- | -------------------------------------------------------------------------------- | :------: | -------- | --------------------------------------------------- |
| advices    | [Advice](../types/3_ChartAdvisor#advice)[]                                       |          |          | All recommendations, same results as Advisor.advise |
| log        | [ScoringResultForChartType](../types/3_ChartAdvisor#scoringresultforcharttype)[] |          |          | Summary scoring records for all chart types.        |

## Examples

```ts
import { Advisor } from '@antv/chart-advisor';

const myAdvisor = new Advisor();
const data = [
  { f1: 'a', f2: 10 },
  { f1: 'b', f2: 20 },
  { f1: 'c', f2: 30 },
];

const { advices, log } = myAdvisor.adviseWithLog({ data });
console.log(advices);
console.log(log);
```
