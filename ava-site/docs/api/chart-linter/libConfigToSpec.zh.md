---
title: libConfigToSpec
order: 1
---

`markdown:docs/common/style.md`

<div class='doc-md'>

```sign
libConfigToSpec(libConfig: G2PlotConfig, libName?: 'G2Plot')
```

### 参数

* **libConfig** * 图表配置
  * _必要参数_
  * `参数类型`: G2PlotConfig

* **libraryName** * 类库名称
  * _可选参数_
  * `参数类型`: `'G2Plot'`
  * `默认值`: `'G2Plot'`

### 返回值

*`Specification | null`*

类库配置项转换而成的通用图表编码，目前已支持对 G2Plot 图表配置的转换，如果转换失败则返回 null。

```sign
interface G2PlotConfig {
  type: G2PlotChartType;
  options: G2PlotOptions;
}
```

* type `G2PlotChartType` 支持 `'line' | 'column' | 'bar' | 'histogram'`
* options `G2PlotOptions` 支持 G2Plot 的 `LineOptions`、`ColumnOptions`、`BarOptions` 和 `HistogramOptions` 四种图表类型配置项

</div>