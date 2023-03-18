import { G2Spec, Mark } from '@antv/g2';

import { InsightInfo, CategoryOutlierInfo } from '../../types';
import { BOLD_FONT_WEIGHT } from '../constants';
import { dataFormat } from '../util';

import { textMarkStrategy } from './augmentedMarks/textMark';
import { insight2ChartStrategy } from './chartStrategy';

export const categoryOutlierAugmentedMarksStrategy = (patterns: CategoryOutlierInfo[]): Mark[] => {
  // todo @chenluli change color of outliers
  const textMark = textMarkStrategy(patterns, { style: { fontWeight: BOLD_FONT_WEIGHT, formatter: dataFormat } });
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
