import { Datum, InsightOptions, InsightInfo, PatternInfo, HomogeneousPatternInfo } from '../interface';
import { extractInsightsAsync } from '../workers';
import { extractInsights, generateInsightsWithVisualizationSchemas } from '../pipeline/insight';

type InsightsResult = {
  insights: InsightInfo<PatternInfo>[];
  homogeneousInsights?: InsightInfo<HomogeneousPatternInfo>[];
};

export const getDataInsights = (sourceData: Datum[], options?: InsightOptions): InsightsResult => {
  const extractResult = extractInsights(sourceData, options);
  return generateInsightsWithVisualizationSchemas(extractResult, options);
};

export const getDataInsightsAsync = async (sourceData: Datum[], options?: InsightOptions): Promise<InsightsResult> => {
  const extractResult = await extractInsightsAsync(sourceData, options);
  return generateInsightsWithVisualizationSchemas(extractResult, options);
};
