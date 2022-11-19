import { extractInsights, generateInsightsWithVisualizationSchemas } from './insight';

import type { Datum, InsightOptions, InsightsResult } from '../types';

export function getInsights(sourceData: Datum[], options?: InsightOptions): InsightsResult {
  const extractResult = extractInsights(sourceData, options);
  if (options?.visualization) {
    return generateInsightsWithVisualizationSchemas(extractResult, options);
  }
  return extractResult;
}
