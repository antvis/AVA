import { Mark } from '@antv/g2';

import { CorrelationInfo, InsightInfo } from '../../../types';
import { insight2ChartStrategy } from '../chart';

export const correlationStrategy = (insight: InsightInfo<CorrelationInfo>): Mark[] => {
  // todo add correlation regression line and value
  const chartMark = insight2ChartStrategy(insight);
  return [chartMark];
};
