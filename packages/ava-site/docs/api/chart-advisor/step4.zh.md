---
title: Step4 - g2plotRender & g2Render
order: 3
---

`markdown:docs/common/style.md`

## g2plotRender

通过 G2Plot 绘制，返回 G2Plot 图表实例

<div class='doc-md'>

```sign
g2plotRender(container: string | HTMLElement, data: any, libConfigs: G2PlotConfig)
```

### 参数

* **container** * 图表所需要被放置的 DOM 容器。
  * _必要参数_
  * `参数类型`: HTMLElement

* **data** * 包含对象型数据行的数组.
  * _必要参数_
  * `参数类型`: Record<string, any>[]

* **container** * Step3 返回的类库配置项
  * _必要参数_
  * `参数类型`: G2PlotConfig

### 返回值

*`G2PlotInstance`*

G2Plot 绘图实例。

</div>

## g2Render

通过 G2 绘制，返回 G2 图表实例

<div class='doc-md'>

```sign
g2Render(container: string | HTMLElement, data: any, configs: G2PlotConfig)
```

### 参数

* **container** * 图表所需要被放置的 DOM 容器。
  * _必要参数_
  * `参数类型`: HTMLElement

* **data** * 包含对象型数据行的数组.
  * _必要参数_
  * `参数类型`: Record<string, any>[]

* **container** * Step3 返回的类库配置项
  * _必要参数_
  * `参数类型`: G2PlotConfig

### 返回值

*`G2Instance`*

</div>
