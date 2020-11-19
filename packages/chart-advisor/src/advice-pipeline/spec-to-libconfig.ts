import { ChartID } from '@antv/knowledge';
import { get as _get, has as _has, set as _set } from 'lodash';
import { Advice, ChartLibrary, G2PlotConfig, EChartsConfig, G2PlotChartType, SingleViewSpec } from './interface';
import { EncodingKey } from './vega-lite';

/**
 * @beta
 */
export function specToLibConfig(
  advice: Advice,
  libraryName: ChartLibrary = 'G2Plot'
): G2PlotConfig | EChartsConfig | null {
  switch (libraryName) {
    case 'G2':
    case 'G2Plot':
      return g2plotAdaptor(advice);
    // case 'echarts':
    //   return echartsAdaptor(advice);
    default:
      return g2plotAdaptor(advice);
  }
}

const G2PLOT_TYPE_MAPPING: Partial<Record<ChartID, G2PlotChartType>> = {
  line_chart: 'Line',
  area_chart: 'Area',
  stacked_area_chart: 'Area',
  percent_stacked_area_chart: 'Area',

  column_chart: 'Column',
  grouped_column_chart: 'Column',
  stacked_column_chart: 'Column',
  percent_stacked_column_chart: 'Column',

  bar_chart: 'Bar',
  grouped_bar_chart: 'Bar',
  stacked_bar_chart: 'Bar',
  percent_stacked_bar_chart: 'Bar',

  histogram: 'Histogram',

  pie_chart: 'Pie',
  donut_chart: 'Pie',
  rose_chart: 'Rose',

  scatter_plot: 'Scatter',
  bubble_chart: 'Scatter',
  heatmap: 'Heatmap',
};

const G2PLOT_ENCODING_MAPPING: Record<string, string> = {
  'x.ticks': 'xAxis.tickLine',
  'x.domain': 'xAxis.line',
  'y.scale.domainMin': 'yAxis.min',
};

function g2plotAdaptor(advice: Advice): G2PlotConfig | null {
  const { type, spec } = advice;

  const chartType = G2PLOT_TYPE_MAPPING[type];
  if (!chartType || !spec) return null;

  // TODO 暂时没有多layer的输出，先粗暴处理
  if ((spec as any).layer) return null;

  const configs: any = {};
  const { encoding } = spec as SingleViewSpec;

  // step1: common config decode
  const CHANNEL_MAPPING: Partial<Record<EncodingKey, string>> = {
    x: 'xField',
    y: 'yField',
    theta: 'angleField',
    color: 'colorField',
    size: 'sizeField',
  };
  Object.keys(encoding).forEach((e) => {
    const key = CHANNEL_MAPPING[e as EncodingKey];
    const channel = encoding[e as EncodingKey];
    if (key && channel && channel.field) {
      configs[key] = channel.field;
    }
  });

  Object.keys(G2PLOT_ENCODING_MAPPING).forEach((key) => {
    if (_has(encoding, key)) {
      _set(configs, G2PLOT_ENCODING_MAPPING[key], _get(encoding, key));
    }
  });

  // step2: map color to series
  const seriesCharts: ChartID[] = [
    'line_chart',
    'grouped_column_chart',
    'stacked_column_chart',
    'grouped_bar_chart',
    'stacked_bar_chart',
    'percent_stacked_column_chart',
    'percent_stacked_bar_chart',
  ];
  if (seriesCharts.includes(type)) {
    configs.seriesField = configs.colorField;
  }

  // step3: add isStack, isGroup, isPercent
  const stackCharts: ChartID[] = [
    'stacked_column_chart',
    'stacked_bar_chart',
    'percent_stacked_column_chart',
    'percent_stacked_bar_chart',
  ];
  if (stackCharts.includes(type)) {
    configs.isStack = true;
  }

  const groupCharts: ChartID[] = ['grouped_bar_chart', 'grouped_column_chart'];
  if (groupCharts.includes(type)) {
    configs.isGroup = true;
  }

  const percentCharts: ChartID[] = [
    'percent_stacked_column_chart',
    'percent_stacked_bar_chart',
    'percent_stacked_area_chart',
  ];
  if (percentCharts.includes(type)) {
    configs.isPercent = true;
  }

  // step4: special config
  if (type === 'grouped_column_chart') {
    configs.xField = encoding.column?.field;
  }

  if (type === 'grouped_bar_chart') {
    configs.yField = encoding.row?.field;
  }

  if (type === 'histogram') {
    configs.binField = encoding.x?.field;
  }

  if (type === 'donut_chart') {
    configs.innerRadius = 0.6;
  }

  if (type === 'bubble_chart') {
    // FIXME g2plot 必须指定散点图的 size
    configs.size = [2, 10];
    configs.shape = 'circle';
  }

  console.log({ type: chartType, configs });
  return { type: chartType, configs };
}

// function echartsAdaptor(advice: Advice): EChartsConfig {}
