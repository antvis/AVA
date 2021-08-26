import { Datum, InsightType, PatternInfo } from '../interface';
import { findCategoryOutliers } from './extractors/categoryOutlier';
import { findTimeSeriesTrend } from './extractors/trend';
import { findChangePoints } from './extractors/changePoint';
import { findTimeSeriesOutliers } from './extractors/timeSeriesOutlier';

type insightExtractor = (data: Datum[], measureKey: string) => PatternInfo[];

export const insightExtractors: Record<InsightType, insightExtractor> = {
  category_outlier: findCategoryOutliers,
  trend: findTimeSeriesTrend,
  change_point: findChangePoints,
  time_series_outlier: findTimeSeriesOutliers,
};

export * from './checkers';
