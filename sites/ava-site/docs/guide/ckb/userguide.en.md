---
title: CKB Concepts & Properties
order: 1
---

`markdown:docs/common/style.md`



## Chart Classification

There are many types of data visualization charts, some are similar, and some are obviously different. By summarizing the properties and applicable scenarios of various chart types, the Chart Knowledge Base can help us understand how to choose the correct chart.


For example, common chart types include: **line chart**, **bar chart**, **pie chart**, etc.


In AVA/CKB, the record for each chart type is like this: (Take the basic pie chart as an example)

```js
  pie_chart: {
    id: 'pie_chart',
    name: 'Pie Chart',
    alias: ['Circle Chart', 'Pie'],
    family: ['PieCharts'],
    def:
      'A pie chart is a chart that the classification and proportion of data are represented by the color and arc length (angle, area) of the sector.',
    purpose: ['Comparison', 'Composition', 'Proportion'],
    coord: ['Polar'],
    category: ['Statistic'],
    shape: ['Round'],
    dataPres: [
      { minQty: 1, maxQty: 1, fieldConditions: ['Nominal', 'Ordinal'] },
      { minQty: 1, maxQty: 1, fieldConditions: ['Interval'] },
    ],
    channel: ['Angle', 'Area', 'Color'],
    recRate: 'Use with Caution',
  },
```

This document will explain the properties one by one.


## Classification Granularity

Even the most common chart type could have many derivatives. For example, a **line chart** could be single line chart, multi line chart, step line chart, etc. A multi line chart could have single color or multi color.

How can we find a fine threshold to decide the granularity of classification? We would try these:

1. Define perspectives as the basis of classification.
2. The charts with same perspectives should be grouped.
3. For practical reasons, charts that are not easily distinguished by users are divided into different types.

## Classification by Perspectives

* Graphic Category
* Chart Family
* Purpose of Analysis
* Coordinate System
* Shape
* Visual Channel
* Data Prerequisites

### Graphic Category

Visualization has several general categories.

In CKB, the property for graphic category is `category`. It is an array with these optional elements:

* `Statistic` - charts for representing statistical data
* `Diagram`- charts for representing status or progress
* `Graph` - node and links to represent relations
* `Map` - representing geographic informaiton

### Chart Family

The chart family is a more subdivided category than graphic category. Charts in a family are close in concept, shape and other classification perspectives. For example, **line chart** and **step line chart** are both in *line charts* family, **pie chart** and **donut chart** are both in *pie charts* family.

In CKB, the property for chart family is `family`. It is an array with these optional elements:

* `LineCharts` - single line chart, multi line chart, step line chart, etc.
* `ColumnCharts` - basic column chart, multi color column chart, grouped column chart, stacked column chart, etc.
* `BarCharts` - basic bar chart, multi color bar chart, grouped bar chart, stacked bar chart, etc.
* `PieCharts` - pie chart, donut chart, etc.
* `AreaCharts` - area chart, stacked area chart, percentage stacked area chart, etc.
* `ScatterCharts` - scatter plot, bubble chart, etc.
* `FunnelCharts` - funnel chart, mirror funnel chart, etc.
* `HeatmapCharts` - heatmap, uneven heatmap, etc.
* `RadarCharts` - basic radar chart, multi color radar chart, etc.
* `Others` - others

### Purpose of Analysis

Charts could be classified according to the analysis purposes. For example, **pie chart** is more suitable for describing the proportion, and **line chart** is more suitable for representing the trend.

In CKB, the property for analysis purpose is `purpose`. It is an array with these optional elements:

* `Comparison`
* `Trend`
* `Distribution`
* `Rank`
* `Proportion`
* `Composition`

### Coordinate System

Charts are usually based on a certain coordinate system, so they can also be classified by the coordinate systems.

In CKB, the property for coordinate system is `coord`. It is an array with these optional elements:

* `NumberLine` - axis, one-dimensional coordinate system
* `Cartesian2D` - two-dimensional rectangular coordinate system
* `SymmetricCartesian` - based on Cartesian2D, the graph is extended to both sides with an axis as the center
* `Cartesian3D` - three-dimensional rectangular coordinate system
* `Polar` - mostly used for circular graphic layouts
* `NodeLink` - network of points and lines
* `Radar` - isometric multi-axis coordinate system diverging from a center point

### Shape

The graphics are classified based on their perception of the shape of the graphics. One can effectively filter chart types in scenarios such as interface design and layout.

In CKB, the property for shape is `shape`. It is an array with these optional elements:

* `Lines` - e.g. line charts, parallel coordinates
* `Bars` - e.g. column charts, bar charts, gantt chart
* `Round` - e.g. pie charts, radar chart
* `Square` - e.g. treemap, heatmap
* `Area` - e.g. area charts, continuous heatmap
* `Scatter` e.g. scatter plot, bubble chart, word clouds
* `Symmetric` e.g. funnel charts

### Visual Channel

Visual channels are to some visual variables that can be used to map data, such as length, shape, color, etc. Charts can also be categorized by organizing the visual channels in the chart type.

In CKB, the property for visual channel is `channel`. It is an array with these optional elements:

* `Position`
* `Length`
* `Color`
* `Area`
* `Angle`
* `ArcLength`
* `Direction`
* `Size`

### Data Prerequisites

The prerequisites for the required data describe the data structures that must be provided in order to make a certain type of chart.

In CKB, the property for data prerequisites is `dataPres`. It is an array. It's elements must be objects with the following format:

```js
{ minQty: 1, maxQty: 1, fieldConditions: ['Interval', 'Nominal'] }
```

The prerequisite above means: the chart type should have one and only one *Interval* or *Nominal* field.

* `minQty` - The minimum number of fields to be met for this condition (an integer greater than or equal to 0)
* `maxQty` - The maximum number of fields to be met for this condition (an integer greater than or equal to minQty or `'*'` stands for unlimited)
* `fieldConditions` - Available level of measurement for this condition

#### Level of Measurement

* `Nominal` - e.g. ["apple", "banana", "pear"]
* `Ordinal` - e.g. ["Level 1", "Level 2", "Level 3"]
* `Interval` - numbers
  * `Discrete` e.g. [1, 3, 4, 10]
  * `Continuous` e.g. [1.2, 3, 4.2, 10.75]
* `Time` - Date format, or Date-Time format

More examples:

```js
...
  dataPres: [

    // data for this chart should contains one and only one Time or Ordinal field
    { minQty: 1, maxQty: 1, fieldConditions: ['Time', 'Ordinal'] },

    // data for this chart should contains 0 or 1 Nominal field
    { minQty: 0, maxQty: 1, fieldConditions: ['Nominal'] },

    // data for this chart should contains at least 2 Interval fields
    { minQty: 2, maxQty: '*', fieldConditions: ['Interval'] },
  ],
...
```

## Chart Type Name & Definition

After determining the chart type based on the classification, we need to supplement some basic information about the chart.

So far, CKB contains three kinds of basic information for each chart type: **name**, **alias** and **def**.

> These three types of information are given in the form of text strings. Therefore, when translating in different languages, internationalization is required for each chart type.

### name

The official name of the chart, usually named after the most widely known name.

### alias

Some aliases for the chart, listed as an array.

### def

Definition of the chart, describing the chart.

----

Have any question about the above? Feel free to [submit a Github issue](https://github.com/antvis/AVA/issues/new) to help us make CKB more complete.


