import type { Specification, ChartSpec } from '../../common/types';

const getPointChart = (spec: ChartSpec) => {
  if (spec.encode.size) {
    return 'bubble_chart';
  }
  return 'scatter_plot';
};

/**
 * 推荐所有 type 为 interval 的 spec 对应的具体图表类型
 * type 为 interval的图表，可能为 column chart、bar chart、pie chart、donut chart
 * @param spec
 * @returns
 */
const getIntervalChart = (spec: ChartSpec) => {
  /** 饼图类型推断 */
  const { coordinate } = spec;
  if (coordinate?.type === 'theta') {
    if (coordinate?.innerRadius) {
      return 'donut_chart';
    }
    return 'pie_chart';
  }

  /** 柱状图、条形图类型推断 */
  const { transform } = spec;
  const isBarChart = coordinate.transform.some((item) => item.type === 'transpose');
  const isNormalized = transform.some((item) => item.type === 'normalizeY');
  const isStacked = transform.some((item) => item.type === 'stackY');
  const isGrouped = transform.some((item) => item.type === 'dodgeX');

  if (isBarChart) {
    // Bar
    if (isGrouped) return 'grouped_bar_chart';
    if (isNormalized) return 'stacked_bar_chart';
    if (isStacked) return 'percent_stacked_bar_chart';
    return 'bar_chart';
  }
  // Column
  if (isGrouped) return 'grouped_column_chart';
  if (isNormalized) return 'stacked_column_chart';
  if (isStacked) return 'percent_stacked_column_chart';
  return 'column_chart';
};

/**
 * 推荐所有 type 为 area 的 spec 对应的具体图表类型
 * @param spec
 * @returns
 */
const getAreaChart = (spec: ChartSpec) => {
  const { transform } = spec;
  const isStacked = transform.some((item) => item.type === 'stackY');
  const isNormalized = transform.some((item) => item.type === 'normalizeY');
  if (isStacked) {
    if (isNormalized) {
      return 'percent_stacked_area_chart';
    }
    return 'stacked_area_chart';
  }
  return 'area_chart';
};

/**
 * 推荐所有 type 为 line 的 spec 对应的具体图表类型
 * @param spec
 * @returns
 */
const getLineChart = (spec: ChartSpec) => {
  const { encode } = spec;
  if (encode.shape && encode.shape === 'hvh') {
    return 'step_line_chart';
  }
  return 'line_chart';
};

/**
 * 由于一种类型的 mark 可能对应多种可能的图表，所以需要此处进行转换
 * @param spec
 * @returns
 */
export const getChartType = (spec: Specification) => {
  let chartType: string;
  const chartSpec = spec as Specification;
  const mark = chartSpec.type;

  switch (mark) {
    case 'area':
      chartType = getAreaChart(chartSpec);
      break;
    case 'interval':
      chartType = getIntervalChart(chartSpec);
      break;
    case 'line':
      chartType = getLineChart(chartSpec);
      break;
    case 'point':
      chartType = getPointChart(chartSpec);
      break;
    case 'rect':
      chartType = 'histogram';
      break;
    case 'cell':
      chartType = 'heatmap';
      break;
    default:
      chartType = '';
  }

  return chartType;
};
