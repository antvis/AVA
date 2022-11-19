---
title: Linter.LintWithLog
order: 22
---

<embed src='@/docs/common/style.md'></embed>

```sign
lintWithLog(params: LintParams): LintsWithLog
```

`Linter.lintWithLog` 方法的作用和 [Linter.lint](./21_Linter-lint) 几乎完全相同。只不过会额外地将查错过程中的打分细节一并返回，方便在应用中进行后续的解释。

## 参数

* **params** Linter 配置项
  * _必选参数_
  * `参数类型`: LintParams 对象

参见 [Linter.lint](./21_Linter-lint#参数)。

## 返回值

_`LintsWithLog`_

```ts
interface LintsWithLog {
  lints: Lint[];
  log: ScoringResultForRule[];
}
```

* _**LintsWithLog**_ 参数配置.

| 属性  | 类型                                                                   | 可选  | 示例 | 描述                                        |
| ----- | ---------------------------------------------------------------------- | :---: | ---- | ------------------------------------------- |
| lints | [Lint](../types/3_ChartAdvisor#lint)[]                                 |       |      | 所有检测出的问题，和 Linter.lint 结果相同。 |
| log   | [ScoringResultForRule](../types/3_ChartAdvisor#scoringresultforrule)[] |       |      | 针对给定 Specification 的所有汇总检测记录。 |

## 示例

```ts
import { Linter } from '@antv/chart-advisor';

const myLinter = new Linter();
const spec = { ...someBadSpec };

const { lints, log } = myLinter.lintWithLog({ spec });
console.log(lints);
console.log(log);
```
