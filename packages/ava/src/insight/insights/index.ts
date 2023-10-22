import { flow } from 'lodash';

import { InsightExtractorProps, PatternInfo } from '../types';

import { getCategoryOutlierInfo } from './extractors/categoryOutlier';
import { getChangePointInfo } from './extractors/changePoint';
import { getCorrelationInfo } from './extractors/correlation';
import { getLowVarianceInfo } from './extractors/lowVariance';
import { getMajorityInfo } from './extractors/majority';
import { getTimeSeriesOutlierInfo } from './extractors/timeSeriesOutlier';
import { getTrendInfo } from './extractors/trend';
import { pickValidPattern } from './util';

export const extractorMap = {
  category_outlier: getCategoryOutlierInfo,
  trend: getTrendInfo,
  change_point: getChangePointInfo,
  time_series_outlier: getTimeSeriesOutlierInfo,
  majority: getMajorityInfo,
  low_variance: getLowVarianceInfo,
  correlation: getCorrelationInfo,
};

export const insightExtractor = (props: InsightExtractorProps): PatternInfo[] => {
  const { insightType = 'trend', options } = props;
  const { filterInsight = false } = options || {};
  const extractor = extractorMap[insightType];
  return flow([extractor, ...(filterInsight ? [pickValidPattern] : [])])(props);
};

export * from './checkers';
