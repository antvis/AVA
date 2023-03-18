import { G2Spec, Mark } from '@antv/g2';

import { LowVarianceInfo, InsightInfo } from '../../types';

import { lineMarkStrategy } from './augmentedMarks/lineMark';

export const lowVarianceAugmentedMarkStrategy = (patterns: LowVarianceInfo[]): Mark[] => {
  const marks = [];
  patterns.forEach((pattern) => {
    const { mean } = pattern;
    const meanLineMark = lineMarkStrategy({ lineY: mean, label: `mean: ${mean}` });
    marks.push(meanLineMark);
  });
  return marks;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const lowVarianceStrategy = (insight: InsightInfo<LowVarianceInfo>): G2Spec => {
  return {};
};
