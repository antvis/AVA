---
title: CKBOptions
order: 2
---

`markdown:docs/common/style.md`



Returns all possible options for each property of Chart Knowledge.

```sign
CKBOptions(lang)
```

## Parameters

* **lang** * Language of property options.
  * _optional_
  * `type`: *Language* extends string
  * `default`: 'en-US'
  * `options`: 'en-US', 'zh-CN'

## Return value

*object* * contains the following keys:

## `CKBOptions().family`

> Types of chart similarity or so called *Chart Family*.

Examples:

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

> Types of higher level of chart taxonomy or so called *Graphic Category*.

Examples:

* Statistic
* Diagram
* Graph
* Map

## `CKBOptions().purpose`

> Types of purpose for which the visualization is used.

Examples:

* Comparison
* Trend
* Distribution
* Rank
* Proportion
* Composition

## `CKBOptions().coord`

> Types of *Coordinate Systems*.

Examples:

* NumberLine
* Cartesian2D
* SymmetricCartesian
* Cartesian3D
* Polar
* NodeLink
* Radar

## `CKBOptions().shape`

> Shapes of the skeleton of visualization.

Examples:

* Lines
* Bars
* Round
* Square
* Area
* Scatter
* Symmetric

## `CKBOptions().channel`

> *Visual Channels*.

Examples:

* Position
* Length
* Color
* Area
* Angle
* ArcLength
* Direction
* Size

## `CKBOptions().lom`

> *Level of Measurement*.

Examples:

* Nominal
* Ordinal
* Interval
* Discrete
* Continuous
* Time

## Examples

```js
import { CKBOptions } from '@antv/knowledge';

const options1 = CKBOptions();
const options2 = CKBOptions('zh-CN');

const allCategories = options1.category;
// ['Statistic', 'Diagram', 'Graph', 'Map']
```


