import { InsightType } from '@antv/ava';

import { getPrefixCls } from '../utils';
/** class name prefix for InsightCard, avar-insight-card */
export const INSIGHT_CARD_PREFIX_CLS = getPrefixCls('insight-card');

export const ALGORITHM_NAME_MAP: Record<InsightType, string> = {
  category_outlier: 'Category Outlier',
  trend: 'trend',
  change_point: 'Change Point',
  time_series_outlier: 'Time Outlier',
  majority: 'Majority',
  low_variance: 'Low Variance',
  correlation: 'Correlation',
};

export const ALGORITHM_NAME_MAP_ZH: Record<InsightType, string> = {
  category_outlier: '异常值',
  trend: '趋势',
  change_point: '突变点',
  time_series_outlier: '时序异常',
  majority: '显著性',
  low_variance: '均匀分布',
  correlation: '相关性',
};

/** default minimum height for card */
export const CARD_CONTENT_HEIGHT = 48;
/** default chart height in card */
export const CHART_HEIGHT = 280;
/** chart carousel plugin key  */
export const DISPLAY_CHARTS_PLUGIN_KEY = 'charts';
/** subspace description plugin key */
export const SUBSPACE_DESCRIPTION_PLUGIN_KEY = 'subspaceDescription';

export const EXPORT_DATA_LABEL = {
  'zh-CN': {
    insightInfo: '复制洞察结果',
    spec: '复制可视化 schema',
  },
  'en-US': {
    insightInfo: 'copy insight result data',
    spec: 'copy visualization spec',
  },
};
