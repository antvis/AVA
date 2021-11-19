---
title: CKBOptions
order: 2
---

`markdown:docs/common/style.md`



得到图表知识所可能包含的所有属性。

```sign
CKBOptions(lang)
```

## 参数

* **lang** * 返回内容针对的语言。
  * _可选参数_
  * `参数类型`: *Language* extends string
  * `默认值`: 'en-US'
  * `选项`: 'en-US', 'zh-CN'

## 返回值

*object* * 包含以下属性:

## `CKBOptions().family`

> *图表大类*一览，相似的图表会被分为一个大类（或家族）。

举例：

* LineCharts
* ColumnCharts
* BarCharts
* PieCharts
* AreaCharts
* ScatterCharts
* FunnelCharts
* HeatmapCharts
* RadarCharts
* Others

## `CKBOptions().category`

> *图形类别*，数据可视化中的图形可以按照结构和性质被分为几个大类。

举例：

* Statistic
* Diagram
* Graph
* Map

## `CKBOptions().purpose`

> *分析目的*，按照图表的分析目的分类，比如**饼图**更适合描述占比、**折线图**更适合描述趋势。

举例：

* Comparison
* Trend
* Distribution
* Rank
* Proportion
* Composition

## `CKBOptions().coord`

> *坐标系*。

举例：

* NumberLine
* Cartesian2D
* SymmetricCartesian
* Cartesian3D
* Polar
* NodeLink
* Radar

## `CKBOptions().shape`

> *形状*，基于对于图形的形状的感性认知，将图形分类。

举例：

* Lines
* Bars
* Round
* Square
* Area
* Scatter
* Symmetric

## `CKBOptions().channel`

> *视觉通道*，视觉通道是指可以用来映射数据的一些视觉元素变量，比如长度、形状、颜色等。通过对图表类型中的视觉通道进行整理，也可以将图表分类。

举例：

* Position
* Length
* Color
* Area
* Angle
* ArcLength
* Direction
* Size

## `CKBOptions().lom`

> *度量级别（Level of Measurement）*，对字段特性的一种描述。比如无序名词、有序名词、数值、日期时间，等。

举例：

* Nominal
* Ordinal
* Interval
* Discrete
* Continuous
* Time

## 示例

```js
import { CKBOptions } from '@antv/knowledge';

const options1 = CKBOptions();
const options2 = CKBOptions('zh-CN');

const allCategories = options1.category;
// ['Statistic', 'Diagram', 'Graph', 'Map']
```


