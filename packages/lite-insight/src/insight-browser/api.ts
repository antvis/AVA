import { Datum, InsightOptions, InsightInfo, PatternInfo, HomogeneousPatternInfo } from '../interface';
import { extractInsightsAsync } from '../workers';
import { extractInsights, generateInsightsWithVisualizationSchemas } from '../pipeline/insight';

type InsightsResult = {
  insights: InsightInfo<PatternInfo>[];
  homogeneousInsights?: InsightInfo<HomogeneousPatternInfo>[];
};

export const getDataInsights = (sourceData: Datum[], options?: InsightOptions): InsightsResult => {
  const extractResult = extractInsights(sourceData, options);
  if (options?.visualization) {
    return generateInsightsWithVisualizationSchemas(extractResult, options);
  }
  return extractResult;
};

/**
 * @deprecated This function will be removed in 3.0.0 because web workers inside a package has a low compatibility with bundlers.
 */
export const getDataInsightsAsync = async (sourceData: Datum[], options?: InsightOptions): Promise<InsightsResult> => {
  const extractResult = await extractInsightsAsync(sourceData, options);
  if (options?.visualization) {
    return generateInsightsWithVisualizationSchemas(extractResult, options);
  }
  return extractResult;
};
