import Heap from 'heap-js';
import { InsightInfo, PatternInfo, HomogeneousPatternInfo } from '../interface';

export const insightPriorityComparator = (a: InsightInfo<PatternInfo>, b: InsightInfo<PatternInfo>) =>
  a.score - b.score;

export const homogeneousInsightPriorityComparator = (
  a: InsightInfo<HomogeneousPatternInfo>,
  b: InsightInfo<HomogeneousPatternInfo>
) => a.score - b.score;

export const addInsightsToHeap = (insights: InsightInfo<PatternInfo>[], heap: Heap<InsightInfo<PatternInfo>>) => {
  insights?.forEach((item) => {
    if (heap.length >= heap.limit) {
      heap.pushpop(item);
    } else {
      heap.add(item);
    }
  });
};
