---
title: g2Render
order: 5
---

`markdown:docs/common/style.md`

<div class='doc-md'>

Use G2 with G2Plot configs to render a G2 instance.

```sign
g2Render(container: string | HTMLElement, data: any, configs: G2PlotConfig)
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

*`G2Instance`*

G2 Instance.

</div>
