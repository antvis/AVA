import { InsightType } from '@antv/ava/lib/insight/types';

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

/** default minimum height for card */
export const CARD_CONTENT_HEIGHT = 48;
/** default chart height in card */
export const CHART_HEIGHT = 150;
/** chart carousel plugin key  */
export const CHART_CAROUSEL_PLUGIN_KEY = 'chartCarousel';
