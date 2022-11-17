import { extractInsights, generateInsightsWithVisualizationSchemas } from './insight';

import type { Datum, InsightOptions, InsightInfo, PatternInfo, HomogeneousPatternInfo } from '../types';

type InsightsResult = {
  insights: InsightInfo<PatternInfo>[];
  homogeneousInsights?: InsightInfo<HomogeneousPatternInfo>[];
};

export function getDataInsights(sourceData: Datum[], options?: InsightOptions): InsightsResult {
  const extractResult = extractInsights(sourceData, options);
  if (options?.visualization) {
    return generateInsightsWithVisualizationSchemas(extractResult, options);
  }
  return extractResult;
}
