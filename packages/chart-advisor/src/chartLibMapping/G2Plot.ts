import { Mapping } from './index';

const G2PLOT_MAPPING: Mapping = {
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

export default G2PLOT_MAPPING;
