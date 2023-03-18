---
title: CKB Constants
order: 3
---

<embed src='@/docs/common/style.md'></embed>


The following constants can be imported directly from the `@antv/ava` package. For example:

```js
import { CHART_IDS } from '@antv/ava';
```

### CHART_IDS

Array of standard IDs for each chart type.

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

Array of chart families.

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

Array of analysis purposes.

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

Array of coordinate systems.

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

Array of graphic categories.

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

Array of shapes.

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

Array of level of measurements.

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

Array of channels.

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

Array of recommend ratings.

* Recommend - For chart types you can safely recommend
* Use with Caution - Not recommended unless you understand the pitfalls of these chart types.
* Not Recommended - We know this chart type exists in the community, but it's really not recommended.

```js
RECOMMEND_RATINGS = [
  'Recommended',
  'Use with Caution',
  'Not Recommended'
]
```
