import { AntVSpec, ChartAntVSpec } from '@antv/antv-spec';

const getPointChart = (spec: ChartAntVSpec) => {
  const specLayer = spec.layer[0];
  if (specLayer.encoding.size) {
    return 'bubble_chart';
  }
  return 'scatter_plot';
};

const getArcChart = (spec: ChartAntVSpec) => {
  const specLayer = spec.layer[0];
  if (typeof specLayer.mark !== 'string' && specLayer.mark.style && specLayer.mark.style.innerRadius) {
    return 'donut_chart';
  }
  return 'pie_chart';
};

const getBarChart = (spec: ChartAntVSpec) => {
  const specLayer = spec.layer[0];
  if (specLayer.encoding.x.type === 'quantitative' && specLayer.encoding.x.bin) {
    // histogram
    return 'histogram';
  }
  if (specLayer.encoding.x.type === 'quantitative') {
    // Bar
    if (specLayer.encoding.row) return 'grouped_bar_chart';
    if (specLayer.encoding.x.stack === 'normalize') return 'stacked_bar_chart';
    if (specLayer.encoding.x.stack || specLayer.encoding.x.stack === 'zero') return 'percent_stacked_bar_chart';
    return 'bar_chart';
  }
  if (specLayer.encoding.y.type === 'quantitative') {
    // Column
    if (specLayer.encoding.column) return 'grouped_column_chart';
    if (specLayer.encoding.y.stack === 'normalize') return 'stacked_column_chart';
    if (specLayer.encoding.y.stack || specLayer.encoding.y.stack === 'zero') return 'percent_stacked_column_chart';
    return 'column_chart';
  }
  return 'bar_chart';
};

const getAreaChart = (spec: ChartAntVSpec) => {
  const specLayer = spec.layer[0];
  if (specLayer.encoding.color && specLayer.encoding.x.stack === 'normalize') return 'percent_stacked_area_chart';
  if (specLayer.encoding.color && specLayer.encoding.x.stack) return 'stacked_area_chart';
  return 'area_chart';
};

const getLineChart = (spec: ChartAntVSpec) => {
  const specLayer = spec.layer[0];
  if (typeof specLayer.mark !== 'string' && specLayer.mark.interpolate) return 'step_line_chart';
  return 'line_chart';
};

export const getChartType = (spec: AntVSpec) => {
  let chartType: string;
  if (spec.basis.type === 'chart') {
    const chartSpec = spec as ChartAntVSpec;
    const mark = typeof chartSpec.layer[0].mark === 'string' ? chartSpec.layer[0].mark : chartSpec.layer[0].mark.type;
    switch (mark) {
      case 'arc':
        chartType = getArcChart(chartSpec);
        break;
      case 'area':
        chartType = getAreaChart(chartSpec);
        break;
      case 'bar':
        chartType = getBarChart(chartSpec);
        break;
      case 'line':
        chartType = getLineChart(chartSpec);
        break;
      case 'point':
        chartType = getPointChart(chartSpec);
        break;
      case 'rect':
        chartType = 'heatmap';
        break;
      default:
        chartType = '';
    }
  }
  return chartType;
};
