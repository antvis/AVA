---
title: adviceToLibConfig
order: 3
---

`markdown:docs/common/style.md`

<div class='doc-md'>

```sign
adviceToLibConfig(advice: Advice, libraryName: ChartLibrary = 'G2Plot')
```

### 参数

* **advice** * Step2 返回的数据类型
  * _必要参数_
  * `参数类型`: Advice[]

* **libraryName** * 类库名称
  * _可选参数_
  * `参数类型`: ChartLibrary `'G2Plot' | 'G2'`
  * `默认值`: `'G2Plot'`

### 返回值

*`G2PlotConfig | null`*

类库对应的配置项类型，如果转换失败则返回 null，ChartLibrary 为 G2Plot 或 G2 的时候均返回 G2PlotConfig：

```sign
interface G2PlotConfig {
  type: G2PlotChartType;
  configs: Record<string, any>;
}
```

* type `G2PlotChartType` G2Plot 对应图表类型 class 名
* configs `Record<string, any>` G2Plot 配置项

</div>
