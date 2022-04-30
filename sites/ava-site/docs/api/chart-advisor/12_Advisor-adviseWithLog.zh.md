---
title: Advisor.adviseWithLog
order: 12
---

`markdown:docs/common/style.md`

```sign
Advisor.adviseWithLog(params: AdviseParams): AdvicesWithLog
```

`Advisor.adviseWithLog` 方法的作用和 [Advisor.advise](./11_Advisor-advise) 几乎完全相同。只不过 `Advisor.adviseWithLog` 会额外地将推荐过程中的打分细节一并返回，方便在应用中进行后续的推荐解释。

## 参数

* **params** Advisor 配置项
  * _必选参数_
  * `参数类型`: AdviseParams 对象

参见 [Advisor.advise](./11_Advisor-advise#参数)。

## 返回值

_`AdvicesWithLog`_

```ts
interface AdvicesWithLog {
  advices: Advice[];
  log: ScoringResultForChartType[];
}
```

* _**AdvicesWithLog**_ 参数配置。

| 属性    | 类型                                                                             | 可选  | 示例 | 描述                                         |
| ------- | -------------------------------------------------------------------------------- | :---: | ---- | -------------------------------------------- |
| advices | [Advice](../types/3_ChartAdvisor#advice)[]                                       |       |      | 所有推荐建议，与 Advisor.advise 的结果相同。 |
| log     | [ScoringResultForChartType](../types/3_ChartAdvisor#scoringresultforcharttype)[] |       |      | 所有图表的汇总打分记录。                     |

## 示例

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
