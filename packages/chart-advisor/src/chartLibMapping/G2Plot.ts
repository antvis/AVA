import { TypeMapping, ConfigMapping } from './index';

export const G2PLOT_CONFIG_MAPPING: ConfigMapping = {
  line_chart: {
    x: 'xField',
    y: 'yField',
    color: 'seriesField',
  },
  area_chart: {
    x: 'xField',
    y: 'yField',
  },
  bar_chart: {
    x: 'xField',
    y: 'yField',
    color: 'colorField',
  },
  column_chart: {
    x: 'xField',
    y: 'yField',
    color: 'colorField',
  },
  pie_chart: {
    angle: 'angleField',
    color: 'colorField',
  },
  // Donut
  donut_chart: {
    angle: 'angleField',
    color: 'colorField',
  },
  // GroupedBar
  grouped_bar_chart: {
    y: 'yField',
    y2: 'groupField',
    x: 'xField',
  },
  // StackedBar
  stacked_bar_chart: {
    y: 'yField',
    y2: 'stackField',
    x: 'xField',
  },
  // PercentageStackedBar
  percent_stacked_bar_chart: {
    y: 'yField',
    y2: 'stackField',
    x: 'xField',
  },
  // GroupedColumn
  grouped_column_chart: {
    x: 'xField',
    x2: 'groupField',
    y: 'yField',
  },
  // StackedColumn
  stacked_column_chart: {
    x: 'xField',
    x2: 'stackField',
    y: 'yField',
  },
  // PercentageStackedColumn
  percent_stacked_column_chart: {
    x: 'xField',
    x2: 'stackField',
    y: 'yField',
  },
  // StackedArea
  stacked_area_chart: {
    x: 'xField',
    x2: 'stackField',
    y: 'yField',
  },
  // PercentageStackedArea
  percent_stacked_area_chart: {
    x: 'xField',
    x2: 'stackField',
    y: 'yField',
  },
  radar_chart: {
    angle: 'angleField',
    radius: 'radiusField',
    series: 'seriesField',
  },
  scatter_plot: {
    x: 'xField',
    y: 'yField',
    color: 'colorField',
  },
  bubble_chart: {
    x: 'xField',
    y: 'yField',
    size: 'sizeField',
    color: 'colorField',
  },
  heatmap: {
    x: 'xField',
    y: 'yField',
    color: 'colorField',
    size: 'sizeField',
  },
  density_heatmap: {
    x: 'xField',
    y: 'yField',
    color: 'colorField',
  },
  step_line_chart: {
    x: 'xField',
    y: 'yField',
    color: 'seriesField',
  },
  funnel_chart: {
    x: 'xField',
    y: 'yField',
  },
  waterfall_chart: {
    x: 'xField',
    y: 'yField',
  },
  mirror_funnel_chart: {
    x: 'xField',
    y: 'yField',
    x2: 'compareField',
  },
  histogram: {
    x: 'binField',
  },
  // range_bar_chart
  // range_column_chart
  // rose_chart
  // treemap
  // wordcloud
};

export const G2PLOT_TYPE_MAPPING: TypeMapping = {
  line_chart: 'Line',
  step_line_chart: 'StepLine',
  area_chart: 'Area',
  stacked_area_chart: 'StackedArea',
  percent_stacked_area_chart: 'PercentageStackedArea',

  column_chart: 'Column',
  grouped_column_chart: 'GroupedColumn',
  stacked_column_chart: 'StackedColumn',
  percent_stacked_column_chart: 'PercentageStackedColumn',

  bar_chart: 'Bar',
  grouped_bar_chart: 'GroupedBar',
  stacked_bar_chart: 'StackedBar',
  percent_stacked_bar_chart: 'PercentageStackedBar',

  histogram: 'Histogram',

  pie_chart: 'Pie',
  donut_chart: 'Donut',
  rose_chart: 'Rose',

  scatter_plot: 'Scatter',
  bubble_chart: 'Bubble',
  radar_chart: 'Radar',

  // density_heatmap: 'DensityHeatmap',
  heatmap: 'Heatmap',

  // funnel_chart: 'Funnel',
  // mirror_funnel_chart: 'MirrorFunnel',

  // treemap: 'TreeMap',
};
