import { ChartId, EncodePrerequisite } from './types';

export type EncodeRequirements = Record<string, EncodePrerequisite>;

// todo @chenluli 全部迁移进入 ckb
export const lineEncodeRequirement: EncodeRequirements = {
  x: {
    maxQty: 1,
    minQty: 1,
    fieldConditions: ['Time', 'Ordinal', 'Nominal'],
  },
  y: {
    maxQty: '*',
    minQty: 1,
    fieldConditions: ['Interval'],
  },
  color: {
    maxQty: '*',
    minQty: 0,
    fieldConditions: ['Nominal', 'Ordinal', 'Time'],
  },
};

export const pieEncodeRequirement: EncodeRequirements = {
  y: {
    maxQty: 1,
    minQty: 1,
    fieldConditions: ['Interval'],
  },
  color: {
    minQty: 1,
    maxQty: 1, // todo 是否限制为 1 个还是允许多个；多个切片维度时，实际上会变成旭日图
    fieldConditions: ['Nominal', 'Ordinal', 'Time'],
  },
};

export const barEncodeRequirement: EncodeRequirements = {
  x: {
    maxQty: 1,
    minQty: 1,
    fieldConditions: ['Nominal', 'Ordinal', 'Time'],
  },
  y: {
    maxQty: '*',
    minQty: 1,
    fieldConditions: ['Interval'],
  },
  color: {
    maxQty: '*',
    minQty: 0,
    fieldConditions: ['Nominal', 'Ordinal', 'Time'],
  },
};

export const scatterEncodeRequirement: EncodeRequirements = {
  x: {
    maxQty: 1,
    minQty: 1,
    fieldConditions: ['Interval'],
  },
  y: {
    maxQty: 1,
    minQty: 1,
    fieldConditions: ['Interval'],
  },
  size: {
    maxQty: 1,
    minQty: 0,
    fieldConditions: ['Interval'],
  },
  color: {
    maxQty: '*',
    minQty: 0,
    fieldConditions: ['Nominal', 'Ordinal', 'Time'],
  },
};

export const histogramEncodeRequirement: EncodeRequirements = {
  x: {
    maxQty: 1,
    minQty: 1,
    fieldConditions: ['Interval'],
  },
  color: {
    maxQty: '*',
    minQty: 0,
    fieldConditions: ['Nominal', 'Ordinal', 'Time'],
  },
};

export const heatmapEncodeRequirement: EncodeRequirements = {
  x: {
    maxQty: 1,
    minQty: 1,
    fieldConditions: ['Nominal', 'Ordinal', 'Time', 'Interval'],
  },
  y: {
    maxQty: 1,
    minQty: 1,
    fieldConditions: ['Nominal', 'Ordinal', 'Time', 'Interval'],
  },
  color: {
    maxQty: '*',
    minQty: 0,
    fieldConditions: ['Interval'],
  },
};

export const indicatorEncodeRequirement: EncodeRequirements = {
  x: {
    minQty: 0,
    maxQty: 1,
    fieldConditions: ['Time', 'Nominal'],
  },
  y: {
    minQty: 0,
    maxQty: '*',
    fieldConditions: ['Interval'],
  },
};

export const areaEncodeRequirement = lineEncodeRequirement;
export const columnEncodeRequirement = barEncodeRequirement;

export const chartType2EncodeRequirement: Partial<Record<ChartId, EncodeRequirements>> = {
  indicator_chart: indicatorEncodeRequirement,
  line_chart: lineEncodeRequirement,
  pie_chart: pieEncodeRequirement,
  donut_chart: pieEncodeRequirement,
  step_line_chart: lineEncodeRequirement,
  area_chart: areaEncodeRequirement,
  stacked_area_chart: areaEncodeRequirement,
  percent_stacked_area_chart: areaEncodeRequirement,
  bar_chart: barEncodeRequirement,
  grouped_bar_chart: barEncodeRequirement,
  stacked_bar_chart: barEncodeRequirement,
  percent_stacked_bar_chart: barEncodeRequirement,
  column_chart: barEncodeRequirement,
  grouped_column_chart: columnEncodeRequirement,
  stacked_column_chart: columnEncodeRequirement,
  percent_stacked_column_chart: columnEncodeRequirement,
  scatter_plot: scatterEncodeRequirement,
  bubble_chart: scatterEncodeRequirement,
  histogram: histogramEncodeRequirement,
  heatmap: heatmapEncodeRequirement,
};
