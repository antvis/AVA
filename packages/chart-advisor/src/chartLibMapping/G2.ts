import { TypeMapping, ConfigMapping } from './index';

/** @beta */
export const G2_CONFIG_MAPPING: ConfigMapping = {
  line_chart: {
    geometry: {
      type: 'line',
    },
    x: 'x',
    y: 'y',
    color: 'color',
  },
  // area_chart: {
  //   geometry: {
  //     type: 'area',
  //   },
  //   x: 'x',
  //   y: 'y',
  // },
  // bar_chart: {
  //   geometry: {
  //     type: 'interval',
  //   },
  //   x: 'x',
  //   y: 'y',
  //   color: 'color',
  // },
  column_chart: {
    geometry: {
      type: 'interval',
    },
    x: 'x',
    y: 'y',
    color: 'color',
  },
  pie_chart: {
    geometry: {
      type: 'interval',
      adjust: 'stack',
    },
    angle: 'angle',
    color: 'color',
  },
  // // Donut
  // donut_chart: {
  //   angle: 'angleField',
  //   color: 'colorField',
  // },
  // // GroupedBar
  grouped_bar_chart: {
    geometry: {
      type: 'interval',
      adjust: 'dodge',
    },
    x: 'x',
    y: 'y',
    x2: 'color',
  },
  // // StackedBar
  // stacked_bar_chart: {
  //   y: 'yField',
  //   y2: 'stackField',
  //   x: 'xField',
  // },
  // // PercentageStackedBar
  // percent_stacked_bar_chart: {
  //   y: 'yField',
  //   y2: 'stackField',
  //   x: 'xField',
  // },
  // // GroupedColumn
  grouped_column_chart: {
    geometry: {
      type: 'interval',
      adjust: 'dodge',
    },
    x: 'x',
    y: 'y',
    x2: 'x2',
  },
  // // StackedColumn
  // stacked_column_chart: {
  //   x: 'xField',
  //   x2: 'stackField',
  //   y: 'yField',
  // },
  // // PercentageStackedColumn
  // percent_stacked_column_chart: {
  //   x: 'xField',
  //   x2: 'stackField',
  //   y: 'yField',
  // },
  // // StackedArea
  // stacked_area_chart: {
  //   x: 'xField',
  //   x2: 'stackField',
  //   y: 'yField',
  // },
  // // PercentageStackedArea
  // percent_stacked_area_chart: {
  //   x: 'xField',
  //   x2: 'stackField',
  //   y: 'yField',
  // },
  // radar_chart: {
  //   angle: 'angleField',
  //   radius: 'radiusField',
  //   series: 'seriesField',
  // },
  scatter_plot: {
    geometry: {
      type: 'point',
    },
    x: 'x',
    y: 'y',
    color: 'color',
  },
  // bubble_chart: {
  //   x: 'xField',
  //   y: 'yField',
  //   size: 'sizeField',
  //   color: 'colorField',
  // },
  // heatmap: {
  //   x: 'xField',
  //   y: 'yField',
  //   color: 'colorField',
  //   size: 'sizeField',
  // },
  // density_heatmap: {
  //   x: 'xField',
  //   y: 'yField',
  //   color: 'colorField',
  // },
  // step_line_chart: {
  //   x: 'xField',
  //   y: 'yField',
  //   color: 'seriesField',
  // },
  // funnel_chart: {
  //   x: 'xField',
  //   y: 'yField',
  // },
  // waterfall_chart: {
  //   x: 'xField',
  //   y: 'yField',
  // },
  // mirror_funnel_chart: {
  //   x: 'xField',
  //   y: 'yField',
  //   x2: 'compareField',
  // },
  // histogram: {
  //   x: 'binField',
  // },
  // range_bar_chart
  // range_column_chart
  // rose_chart
  // treemap
  // wordcloud
};

/**
 * G2's type is not required for paint, but required for autoChart
 */
export const G2_TYPE_MAPPING: TypeMapping = {
  line_chart: 'line_chart',
  // step_line_chart: 'StepLine',
  area_chart: 'area_chart',
  // stacked_area_chart: 'StackedArea',
  // percent_stacked_area_chart: 'PercentageStackedArea',

  // column_chart: 'Column',
  grouped_column_chart: 'grouped_column_chart',
  // stacked_column_chart: 'StackedColumn',
  // percent_stacked_column_chart: 'PercentageStackedColumn',

  // bar_chart: 'Bar',
  // grouped_bar_chart: 'GroupedBar',
  // stacked_bar_chart: 'StackedBar',
  // percent_stacked_bar_chart: 'PercentageStackedBar',

  // histogram: 'Histogram',

  // pie_chart: 'pie',
  // donut_chart: 'Donut',
  // rose_chart: 'Rose',

  scatter_plot: 'scatter_plot',
  // bubble_chart: 'Bubble',
  // radar_chart: 'Radar',

  // density_heatmap: 'DensityHeatmap',
  // heatmap: 'Heatmap',

  // funnel_chart: 'Funnel',
  // mirror_funnel_chart: 'MirrorFunnel',

  // treemap: 'TreeMap',
};
