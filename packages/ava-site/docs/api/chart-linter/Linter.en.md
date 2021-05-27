---
title: Linter
order: 0
---

`markdown:docs/common/style.md`

<div class="doc-md">

The Linter class in Chart Linter, which is responsible for identifying chart problems, can be used to generate a Linter instance. It provides the function needed for chart optimization.

```ts
import { Linter } from '@antv/chart-linter';

const linter = new Linter();
```

After the Linter instance is created, the initialization function should be executed. In the initialization process, some modules for chart optimization will be got.

```sign
linter.init();
```

Then, the Linter instance can receive the chart configuration, and the return result is the list of problems in the chart.

```sign
linter.solve(program: string, options: SolveOptions = {});
```

</div>
