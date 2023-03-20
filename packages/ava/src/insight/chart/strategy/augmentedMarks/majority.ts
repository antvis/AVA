import { Mark } from '@antv/g2';

import { MajorityInfo, InsightInfo } from '../../../types';
import { insight2ChartStrategy } from '../chart';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const majorityStrategy = (insight: InsightInfo<MajorityInfo>, _patterns: MajorityInfo[]): Mark[] => {
  const chartMark = insight2ChartStrategy(insight);
  return [chartMark];
};
