import Heap from 'heap-js';

import type { InsightInfo, PatternInfo, HomogeneousPatternInfo } from '../types';

export const insightPriorityComparator = (a: InsightInfo<PatternInfo>, b: InsightInfo<PatternInfo>) =>
  a.score - b.score;

export const homogeneousInsightPriorityComparator = (
  a: InsightInfo<HomogeneousPatternInfo>,
  b: InsightInfo<HomogeneousPatternInfo>
) => a.score - b.score;

export function addInsightsToHeap(insights: InsightInfo<PatternInfo>[], heap: Heap<InsightInfo<PatternInfo>>) {
  insights?.forEach((item) => {
    if (heap.length >= heap.limit) {
      heap.pushpop(item);
    } else {
      heap.add(item);
    }
  });
}
