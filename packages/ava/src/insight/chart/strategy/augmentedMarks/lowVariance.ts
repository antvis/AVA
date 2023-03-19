import { Mark } from '@antv/g2';

import { LowVarianceInfo, InsightInfo } from '../../../types';
import { lineMarkStrategy } from '../commonMarks';
import { insight2ChartStrategy } from '../chart';

export const lowVarianceAugmentedMarkStrategy = (patterns: LowVarianceInfo[]): Mark[] => {
  const marks = [];
  patterns.forEach((pattern) => {
    const { mean } = pattern;
    const meanLineMark = lineMarkStrategy({ y: mean }, { label: `mean: ${mean}` });
    marks.push(meanLineMark);
  });
  return marks;
};

export const lowVarianceStrategy = (insight: InsightInfo<LowVarianceInfo>, patterns: LowVarianceInfo[]): Mark[] => {
  const chartMark = insight2ChartStrategy(insight);
  const augmentedMarks = lowVarianceAugmentedMarkStrategy(patterns);
  return [chartMark, ...augmentedMarks];
};
