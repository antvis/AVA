import { spawn, Worker } from 'threads';
import { Datum, InsightOptions, InsightInfo, PatternInfo, HomogeneousPatternInfo } from '../interface';
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
  const insight = await spawn(new Worker('./worker'));
  const extractResult = await insight.extractInsights(sourceData, options);

  return generateInsightsWithVisualizationSchemas(extractResult, options);
};
