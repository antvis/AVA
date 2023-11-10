import { Mark } from '@antv/g2';

import { LowVarianceInfo, InsightInfo } from '../../../types';
import { lineMarkStrategy } from '../commonMarks';
import { insight2ChartStrategy } from '../chart';
import { LowVarianceMark } from '../../types';
import { augmentedMarks2Marks } from '../../utils';

export const lowVarianceAugmentedMarkStrategy = (insight: InsightInfo<LowVarianceInfo>): LowVarianceMark[] => {
  const { patterns } = insight;
  const marks: LowVarianceMark[] = [];
  patterns.forEach((pattern) => {
    const { mean } = pattern;
    const meanLineMark = lineMarkStrategy({ y: mean }, { label: `mean: ${mean}` });
    marks.push({
      meanLine: [meanLineMark],
    });
  });
  return marks;
};

export const lowVarianceStrategy = (insight: InsightInfo<LowVarianceInfo>): Mark[] => {
  const chartMark = insight2ChartStrategy(insight);
  const lowVarianceMarks = lowVarianceAugmentedMarkStrategy(insight);
  const marks = augmentedMarks2Marks(lowVarianceMarks);
  return [chartMark, ...marks];
};
