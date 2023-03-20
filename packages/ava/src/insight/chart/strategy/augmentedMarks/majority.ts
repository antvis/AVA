import { Mark } from '@antv/g2';

import { MajorityInfo, InsightInfo } from '../../../types';
import { insight2ChartStrategy } from '../chart';

export const majorityStrategy = (insight: InsightInfo<MajorityInfo>): Mark[] => {
  const chartMark = insight2ChartStrategy(insight);
  return [chartMark];
};
