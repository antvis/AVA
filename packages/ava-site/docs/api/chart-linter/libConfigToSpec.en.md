---
title: libConfigToSpec
order: 1
---

`markdown:docs/common/style.md`

<div class='doc-md'>

```sign
libConfigToSpec(libConfig: G2PlotConfig, libName?: 'G2Plot')
```

### Arguments

* **libConfig** * Chart Configuration
  * _required_
  * `type`: G2PlotConfig

* **libraryName** * Library Name
  * _optional_
  * `type`: `'G2Plot'`
  * `default`: `'G2Plot'`

### Returns

*`Specification | null`*

The specification transformed from the configuration of library.

```sign
interface G2PlotConfig {
  type: G2PlotChartType;
  options: G2PlotOptions;
}
```

* type `G2PlotChartType` `'line' | 'column' | 'bar' | 'histogram'`
* options `G2PlotOptions` `'LineOptions' | 'ColumnOptions' | 'BarOptions' | 'HistogramOptions'`

</div>