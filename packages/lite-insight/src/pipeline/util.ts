import { InsightInfo, PatternInfo, HomogeneousPatternInfo } from '../interface';

export const insightPriorityComparator = (a: InsightInfo<PatternInfo>, b: InsightInfo<PatternInfo>) =>
  b.score - a.score;
export const homogeneousInsightPriorityComparator = (
  a: InsightInfo<HomogeneousPatternInfo>,
  b: InsightInfo<HomogeneousPatternInfo>
) => b.score - a.score;
