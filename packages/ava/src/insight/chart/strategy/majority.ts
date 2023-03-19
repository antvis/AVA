import { G2Spec } from '@antv/g2';

import { MajorityInfo, InsightInfo } from '../../types';

import { insight2ChartStrategy } from './chartStrategy';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const majorityStrategy = (insight: InsightInfo<MajorityInfo>, patterns: MajorityInfo[]): G2Spec => {
  const chart = insight2ChartStrategy(insight);
  return {
    chart,
  };
};
