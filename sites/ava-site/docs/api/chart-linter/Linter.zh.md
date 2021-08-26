---
title: Linter
order: 0
---

`markdown:docs/common/style.md`

<div class="doc-md">

ChartLinter 中负责识别图表问题的 Linter class，可用于生成一个 Linter 实例。通过 Linter 实例，可以使用到各种图表优化方法。

```ts
import { Linter } from '@antv/chart-linter';

const linter = new Linter();
```

Linter 实例创建好后，需要执行初始化方法。初始化过程中，会获取后续图表优化过程中需要使用的一些模块。

```sign
linter.init();
```

初始化之后，Linter 实例就可以开始接收图表配置项，返回结果是图表中存在的问题列表。`program` 是 `vl2asp` 方法处理后的图表配置字符串。

```sign
linter.solve(program: string, options: SolveOptions = {});
```

</div>
