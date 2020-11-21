---
title: adviceToLibConfig
order: 3
---

`markdown:docs/common/style.md`

<div class='doc-md'>

```sign
adviceToLibConfig(advice: Advice, libraryName: ChartLibrary = 'G2Plot')
```

### Arguments

* **advice** * Advice of chart.
  * _required_
  * `type`: Advice[]

* **libraryName** * Charting library.
  * _optional_
  * `type`: ChartLibrary `'G2Plot' | 'G2'`
  * `default`: `'G2Plot'`

### Returns

*`G2PlotConfig | null`*

```ts
interface G2PlotConfig {
  type: G2PlotChartType;
  configs: Record<string, any>;
}
```

* type `G2PlotChartType` G2Plot Class
* configs `Record<string, any>` G2Plot Config

</div>
