import { G2Spec } from '@antv/g2';

import { CorrelationInfo, InsightInfo } from '../../types';

import { insight2ChartStrategy } from './chartStrategy';

export const correlationStrategy = (insight: InsightInfo<CorrelationInfo>): G2Spec => {
  // todo add correlation regression line and value
  const chart = insight2ChartStrategy(insight);
  return {
    chart,
  };
};
