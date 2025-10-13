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
  // 对比类：包含：radar
  COMPARISON: {
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
