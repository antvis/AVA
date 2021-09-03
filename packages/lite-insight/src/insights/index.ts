import { extractor as categoryOutlierExtractor } from './extractors/categoryOutlier';
import { extractor as trendExtractor } from './extractors/trend';
import { extractor as ChangePointExtractor } from './extractors/changePoint';
import { extractor as timeSeriesOutlierExtractor } from './extractors/timeSeriesOutlier';

export const insightExtractors = {
  category_outlier: categoryOutlierExtractor,
  trend: trendExtractor,
  change_point: ChangePointExtractor,
  time_series_outlier: timeSeriesOutlierExtractor,
};

export * from './checkers';
