import { InsightInfo } from '../interface';

export const insightPriorityComparator = (a: InsightInfo, b: InsightInfo) => b.score - a.score;
