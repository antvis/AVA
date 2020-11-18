---
title: CKBOptions
order: 1
---

`markdown:docs/common/style.md`


## `CKBOptions([lang='en-US'])`

> Returns all possible options for each property of Chart Knowledge.

### Arguments

* **lang** * Language of property options.
  * `optional`
  * `type`: *Language* extends string
  * `default`: 'en-US'
  * `options`:
    * 'en-US'
    * 'zh-CN'

### Returns

*object* * contains the following keys:

#### `CKBOptions().family`

> Types of chart similarity or so called *Chart Family*.

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

#### `CKBOptions().category`

> Types of higher level of chart taxonomy or so called *Graphic Category*.

* Statistic
* Diagram
* Graph
* Map

#### `CKBOptions().purpose`

> Types of purpose for which the visualization is used.

* Comparison
* Trend
* Distribution
* Rank
* Proportion
* Composition

#### `CKBOptions().coord`

> Types of *Coordinate Systems*.

* NumberLine
* Cartesian2D
* SymmetricCartesian
* Cartesian3D
* Polar
* NodeLink
* Radar

#### `CKBOptions().shape`

> Shapes of the skeleton of visualization.

* Lines
* Bars
* Round
* Square
* Area
* Scatter
* Symmetric

#### `CKBOptions().channel`

> *Visual Channels*.

* Position
* Length
* Color
* Area
* Angle
* ArcLength
* Direction
* Size

#### `CKBOptions().lom`

> *Level of Measurement*.

* Nominal
* Ordinal
* Interval
* Discrete
* Continuous
* Time

### Examples

```js
import { CKBOptions } from '@antv/knowledge';

const options1 = CKBOptions();
const options2 = CKBOptions('zh-CN');

const allCategories = options1.category;
// ['Statistic', 'Diagram', 'Graph', 'Map']
```
