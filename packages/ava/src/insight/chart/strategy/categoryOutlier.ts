import { Mark } from '@antv/g2';

import { InsightInfo, CategoryOutlierInfo } from '../../types';
import { BOLD_FONT_WEIGHT } from '../constants';
import { dataFormat } from '../../../utils';

import { insight2ChartStrategy } from './chartStrategy';
import { textMarkStrategy } from './commonMarks';

export const categoryOutlierAugmentedMarksStrategy = (patterns: CategoryOutlierInfo[]): Mark[] => {
  // todo @chenluli change color of outliers
  const textMark = textMarkStrategy(patterns, { style: { fontWeight: BOLD_FONT_WEIGHT, formatter: dataFormat } });
  return [textMark];
};

export const categoryOutlierStrategy = (
  insight: InsightInfo<CategoryOutlierInfo>,
  patterns: CategoryOutlierInfo[]
): Mark[] => {
  const chart = insight2ChartStrategy(insight);
  const augmentedMarks = categoryOutlierAugmentedMarksStrategy(patterns);
  return [chart, ...augmentedMarks];
};
