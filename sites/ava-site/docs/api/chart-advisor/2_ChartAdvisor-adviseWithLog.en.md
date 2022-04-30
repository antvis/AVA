---
title: ChartAdvisor.adviseWithLog
order: 2
---

`markdown:docs/common/style.md`

```sign
ChartAdvisor.adviseWithLog(params: AdviseParams): AdvicesWithLog
```

The `ChartAdvisor.adviseWithLog` method does almost exactly the same thing as [ChartAdvisor.advise](./1_ChartAdvisor-advise) except that `ChartAdvisor.advanceWithLog` additionally returns the scoring details of the recommendation process for subsequent interpretation of the recommendation in any application.

## Parameters

* **params** ChartAdvisor configurations
  * _required_
  * `type`: AdviseParams

See [ChartAdvisor.advise](./1_ChartAdvisor-advise#parameters).

## Return value

_`AdvicesWithLog`_

```ts
interface AdvicesWithLog {
  advices: Advice[];
  log: ScoringResultForChartType[];
}
```

* _**AdvicesWithLog**_ Parameter configuration.

| Properties | Type                                                                             | Optional | Examples | Description                                              |
| ---------- | -------------------------------------------------------------------------------- | :------: | -------- | -------------------------------------------------------- |
| advices    | [Advice](../types/3_ChartAdvisor#advice)[]                                       |          |          | All recommendations, same results as ChartAdvisor.advise |
| log        | [ScoringResultForChartType](../types/3_ChartAdvisor#scoringresultforcharttype)[] |          |          | Summary scoring records for all chart types.             |

## Examples

```ts
import { ChartAdvisor } from '@antv/chart-advisor';

const myCA = new ChartAdvisor();
const data = [
  { f1: 'a', f2: 10 },
  { f1: 'b', f2: 20 },
  { f1: 'c', f2: 30 },
];

const { advices, log } = myCA.adviseWithLog({ data });
console.log(advices);
console.log(log);
```
