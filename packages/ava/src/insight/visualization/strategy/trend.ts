import { G2Spec, Mark } from '@antv/g2';

import { TrendInfo, InsightInfo } from '../../types';

import { lineMarkStrategy } from './augmentedMarks/lineMark';

export const trendAugmentedMarksStrategy = (patterns: TrendInfo[]): Mark[] => {
  const marks = [];
  patterns.forEach((pattern) => {
    const {
      regression: {
        points,
        equation: [m, c],
      },
    } = pattern;
    const regressionLineMark = lineMarkStrategy({ points, label: `y=${m.toFixed(2)}x+${c.toFixed(2)}` });
    marks.push(regressionLineMark);
  });
  return marks;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const trendStrategy = (insight: InsightInfo<TrendInfo>): G2Spec => {
  return {};
};
