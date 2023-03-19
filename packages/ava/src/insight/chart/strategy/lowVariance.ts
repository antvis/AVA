import { G2Spec, Mark } from '@antv/g2';

import { LowVarianceInfo, InsightInfo } from '../../types';

import { lineMarkStrategy } from './commonMarks';
import { insight2ChartStrategy } from './chartStrategy';

export const lowVarianceAugmentedMarkStrategy = (patterns: LowVarianceInfo[]): Mark[] => {
  const marks = [];
  patterns.forEach((pattern) => {
    const { mean } = pattern;
    const meanLineMark = lineMarkStrategy({ y: mean }, { label: `mean: ${mean}` });
    marks.push(meanLineMark);
  });
  return marks;
};

export const lowVarianceStrategy = (insight: InsightInfo<LowVarianceInfo>, patterns: LowVarianceInfo[]): G2Spec => {
  const chartSpec = insight2ChartStrategy(insight);
  const marks = lowVarianceAugmentedMarkStrategy(patterns);
  return {
    chartSpec,
    ...marks,
  };
};
