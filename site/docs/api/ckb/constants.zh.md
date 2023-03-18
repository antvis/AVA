---
title: CKB 相关常量
order: 3
---

<embed src='@/docs/common/style.md'></embed>

以下常量可以直接从 `@antv/ava` 包中 import。比如：

```js
import { CHART_IDS } from '@antv/ava';
```

### CHART_IDS

所有图表类型的标准 ID

```js
CHART_IDS = [
  'line_chart',
  'step_line_chart',
  'area_chart',
  'stacked_area_chart',
  'percent_stacked_area_chart',
  'column_chart',
  'grouped_column_chart',
  'stacked_column_chart',
  'percent_stacked_column_chart',
  'range_column_chart',
  'waterfall_chart',
  'histogram',
  'bar_chart',
  'stacked_bar_chart',
  'percent_stacked_bar_chart',
  'grouped_bar_chart',
  'range_bar_chart',
  'radial_bar_chart',
  'bullet_chart',
  'pie_chart',
  'donut_chart',
  'nested_pie_chart',
  'rose_chart',
  'scatter_plot',
  'bubble_chart',
  'non_ribbon_chord_diagram',
  'arc_diagram',
  'chord_diagram',
  'treemap',
  'sankey_diagram',
  'funnel_chart',
  'mirror_funnel_chart',
  'box_plot',
  'heatmap',
  'density_heatmap',
  'radar_chart',
  'wordcloud',
  'candlestick_chart',
  'compact_box_tree',
  'dendrogram',
  'indented_tree',
  'radial_tree',
  'flow_diagram',
  'fruchterman_layout_graph',
  'force_directed_layout_graph',
  'fa2_layout_graph',
  'mds_layout_graph',
  'circular_layout_graph',
  'spiral_layout_graph',
  'radial_layout_graph',
  'concentric_layout_graph',
  'grid_layout_graph',
]
```

### FAMILIES

所有图表家族

```js
FAMILIES = [
  'LineCharts',
  'ColumnCharts',
  'BarCharts',
  'PieCharts',
  'AreaCharts',
  'ScatterCharts',
  'FunnelCharts',
  'HeatmapCharts',
  'RadarCharts',
  'TreeGraph',
  'GeneralGraph',
  'PolygonLayer',
  'LineLayer',
  'PointLayer',
  'HeatmapLayer',
  'Table',
  'Others',
]
```

### PURPOSES

所有分析目的

```js
PURPOSES = [
  'Comparison',
  'Trend',
  'Distribution',
  'Rank',
  'Proportion',
  'Composition',
  'Relation',
  'Hierarchy',
  'Flow',
  'Spatial',
  'Anomaly',
  'Value',
]
```

### COORDINATE_SYSTEMS

所有坐标系类型

```js
COORDINATE_SYSTEMS = [
  'NumberLine',
  'Cartesian2D',
  'SymmetricCartesian',
  'Cartesian3D',
  'Polar',
  'NodeLink',
  'Radar',
  'Geo',
  'Other',
]
```

### GRAPHIC_CATEGORIES

所有图形大类

```js
GRAPHIC_CATEGORIES = [
  'Statistic',
  'Diagram',
  'Graph',
  'Map',
  'Other'
]
```

### SHAPES

所有形状

```js
SHAPES = [
  'Lines',
  'Bars',
  'Round',
  'Square',
  'Area',
  'Scatter',
  'Symmetric',
  'Network',
  'Map',
  'Other',
]
```

### LEVEL_OF_MEASUREMENTS

所有度量水平

```js
LEVEL_OF_MEASUREMENTS = [
  'Nominal',
  'Ordinal',
  'Interval',
  'Discrete',
  'Continuous',
  'Time'
]
```

### CHANNELS

所有通道

```js
CHANNELS = [
  'Position',
  'Length',
  'Color',
  'Area',
  'Angle',
  'ArcLength',
  'Direction',
  'Size',
  'Opacity',
  'Stroke',
  'LineWidth',
  'Lightness',
]
```

### RECOMMEND_RATINGS

所有推荐评级

* Recommend - 可以安全推荐的图表类型
* Use with Caution - 除非你了解这些图表类型的缺陷，否则不推荐使用
* Not Recommended - 我们知道这种图表类型在社区里存在，但真的不建议使用

```js
RECOMMEND_RATINGS = [
  'Recommended',
  'Use with Caution',
  'Not Recommended'
]
```
