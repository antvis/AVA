import { Datum, InsightOptions, InsightInfo, PatternInfo, HomogeneousPatternInfo } from '../interface';
import createWorker from './createWorker';
import { TASK } from './constant';

type InsightsResult = {
  insights: InsightInfo<PatternInfo>[];
  homogeneousInsights?: InsightInfo<HomogeneousPatternInfo>[];
};

const extractInsightsAsync = (data: Datum[], options?: InsightOptions) =>
  createWorker<InsightsResult>(TASK.extractInsights)(data, options);

export { extractInsightsAsync };
