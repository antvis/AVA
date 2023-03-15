// hide them temporarily to solve package size issue caused by stdlib
// import { extractor as categoryOutlierExtractor } from './extractors/categoryOutlier';
// import { extractor as trendExtractor } from './extractors/trend';
import { extractor as ChangePointExtractor } from './extractors/changePoint';
// import { extractor as timeSeriesOutlierExtractor } from './extractors/timeSeriesOutlier';
import { extractor as majorityExtractor } from './extractors/majority';
import { extractor as lowVarianceExtractor } from './extractors/lowVariance';
// import { extractor as correlationExtractor } from './extractors/correlation';
import {
  extractHomogeneousPatternsForMeasures,
  extractHomogeneousPatternsForSiblingGroups,
} from './extractors/homogeneous';

export const insightExtractors = {
  // category_outlier: categoryOutlierExtractor,
  // trend: trendExtractor,
  change_point: ChangePointExtractor,
  // time_series_outlier: timeSeriesOutlierExtractor,
  majority: majorityExtractor,
  low_variance: lowVarianceExtractor,
  // correlation: correlationExtractor,
  extractHomogeneousPatternsForMeasures,
  extractHomogeneousPatternsForSiblingGroups,
};

export * from './checkers';
