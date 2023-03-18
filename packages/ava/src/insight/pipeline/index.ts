import { extractInsights, generateInsightsWithVisualizationSpec } from './insight';

import type { Datum, InsightOptions, InsightsResult } from '../types';

export function getInsights(sourceData: Datum[], options?: InsightOptions): InsightsResult {
  const extractResult = extractInsights(sourceData, options);
  if (options?.visualization) {
    return generateInsightsWithVisualizationSpec(extractResult, options);
  }
  return extractResult;
}
