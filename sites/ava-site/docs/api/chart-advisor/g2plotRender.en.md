---
title: g2plotRender
order: 4
---

`markdown:docs/common/style.md`

<div class='doc-md'>

Use G2Plot with its configs to render a chart.

```sign
g2plotRender(container: string | HTMLElement, data: any, libConfigs: G2PlotConfig)
```

### Arguments

* **container** * DOM to render the chart.
  * _required_
  * `type`: HTMLElement

* **data** * Dataset.
  * _required_
  * `type`: Record<string, any>[]

* **container** * G2Plot configs.
  * _required_
  * `type`: G2PlotConfig

### Returns

*`G2PlotInstance`*

G2Plot Instance

</div>
