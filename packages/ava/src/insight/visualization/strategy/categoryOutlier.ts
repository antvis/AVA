import { G2Spec, Mark } from '@antv/g2';

import { InsightInfo, CategoryOutlierInfo } from '../../types';
import { BOLD_FONT_WEIGHT } from '../constants';

import { textMarkStrategy } from './augmentedMarks/textMark';
import { insight2ChartStrategy } from './basicCharts';

export const categoryOutlierAugmentedMarksStrategy = (patterns: CategoryOutlierInfo[]): Mark[] => {
  // todo @chenluli change color of outliers
  const textMark = textMarkStrategy(patterns, { style: { fontWeight: BOLD_FONT_WEIGHT } });
  return [textMark];
};

export const categoryOutlierStrategy = (insight: InsightInfo<CategoryOutlierInfo>): G2Spec => {
  const marks = categoryOutlierAugmentedMarksStrategy(insight.patterns);
  const chart = insight2ChartStrategy(insight);
  return {
    chart,
    ...marks,
  };
};
