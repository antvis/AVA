import { Mark } from '@antv/g2';
import { size } from 'lodash';

import { dataFormat } from '@ava/utils';
import { InsightInfo, CategoryOutlierInfo, CategoryOutlierMark } from '@ava/types';
import { BOLD_FONT_WEIGHT } from '@ava/constants';

import { insight2ChartStrategy } from '../chart';
import { textMarkStrategy, intervalMarkStrategy } from '../commonMarks';
import { augmentedMarks2Marks } from '../../utils';

export const categoryOutlierAugmentedMarksStrategy = (
  insight: InsightInfo<CategoryOutlierInfo>
): CategoryOutlierMark[] => {
  const { patterns } = insight;

  if (!size(patterns)) return [];

  const categoryOutlierMarks: CategoryOutlierMark[] = [];
  patterns.forEach((pattern) => {
    const rectMark = intervalMarkStrategy([pattern]);
    const textMark = textMarkStrategy([pattern], {
      style: { fontWeight: BOLD_FONT_WEIGHT, dy: -8 },
      formatter: dataFormat,
    });
    categoryOutlierMarks.push({
      categoryOutlier: [rectMark, textMark],
    });
  });

  return categoryOutlierMarks;
};

export const categoryOutlierStrategy = (insight: InsightInfo<CategoryOutlierInfo>): Mark[] => {
  const chart = insight2ChartStrategy(insight);
  const categoryOutlierMarks = categoryOutlierAugmentedMarksStrategy(insight);
  const marks = augmentedMarks2Marks(categoryOutlierMarks);
  return [chart, ...marks];
};
