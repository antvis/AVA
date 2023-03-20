import { Mark } from '@antv/g2';

import { dataFormat } from '../../../../utils';
import { InsightInfo, CategoryOutlierInfo } from '../../../types';
import { BOLD_FONT_WEIGHT } from '../../constants';
import { insight2ChartStrategy } from '../chart';
import { textMarkStrategy, intervalMarkStrategy } from '../commonMarks';

export const categoryOutlierAugmentedMarksStrategy = (insight: InsightInfo<CategoryOutlierInfo>): Mark[] => {
  const { patterns } = insight;
  // todo @chenluli change color of outliers
  const rectMark = intervalMarkStrategy(patterns);
  const textMark = textMarkStrategy(patterns, {
    style: { fontWeight: BOLD_FONT_WEIGHT, dy: -8 },
    formatter: dataFormat,
  });
  return [rectMark, textMark];
};

export const categoryOutlierStrategy = (insight: InsightInfo<CategoryOutlierInfo>): Mark[] => {
  const chart = insight2ChartStrategy(insight);
  const augmentedMarks = categoryOutlierAugmentedMarksStrategy(insight);
  return [chart, ...augmentedMarks];
};
