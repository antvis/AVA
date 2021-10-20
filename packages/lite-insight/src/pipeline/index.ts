import { Datum, InsightOptions, InsightInfo, PatternInfo, HomogeneousPatternInfo } from '../interface';
import { extractInsights, generateInsightsWithVisualizationSchemas } from './insight';

type InsightsResult = {
  insights: InsightInfo<PatternInfo>[];
  homogeneousInsights?: InsightInfo<HomogeneousPatternInfo>[];
};

export const getDataInsights = (sourceData: Datum[], options?: InsightOptions): InsightsResult => {
  const extractResult = extractInsights(sourceData, options);
  return generateInsightsWithVisualizationSchemas(extractResult, options);
};
