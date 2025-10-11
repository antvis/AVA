import { CHART_NAME } from './advisor';

// 按图表类型，将通用encode映射到GPT_VIS的encode
export const ENCODE_TO_GPT_VIS_ENCODE = {
  // 趋势类，包含：line、area
  TREND: {
    x: 'time',
    y: 'value',
    s: 'group',
  },
  // 分布类，包含：bar、column
  DISTRIBUTION: {
    x: 'category',
    y: 'value',
    s: 'group',
  },
};

// 每种图表类型GPT_VIS encode 映射
export const CHART_TO_GPT_VIS_ENCODE_MAP = {
  [CHART_NAME.line]: ENCODE_TO_GPT_VIS_ENCODE.TREND,
  [CHART_NAME.column]: ENCODE_TO_GPT_VIS_ENCODE.DISTRIBUTION,
  [CHART_NAME.area]: ENCODE_TO_GPT_VIS_ENCODE.TREND,
  [CHART_NAME.bar]: ENCODE_TO_GPT_VIS_ENCODE.DISTRIBUTION,
};
