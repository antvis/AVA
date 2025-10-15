import { CHART_PURPOSE } from './advisor';

// 按图表类型，将通用encode映射到GPT_VIS的encode
export const ENCODE_TO_GPT_VIS_ENCODE = {
  // 趋势类，包含：line、area
  [CHART_PURPOSE.Trend]: {
    x: 'time',
    y: 'value',
    s: 'group',
  },
  // 分布类，包含：bar、column
  [CHART_PURPOSE.Distribution]: {
    x: 'category',
    y: 'value',
    s: 'group',
  },
  // 对比类：包含：radar
  [CHART_PURPOSE.Comparison]: {
    x: 'name',
    y: 'value',
    s: 'group',
  },
};

export const DEFAULT_UI_CONFIG = {
  backgroundColor: '#fff',
  lineWidth: 2,
  theme: 'default' as const,
};
