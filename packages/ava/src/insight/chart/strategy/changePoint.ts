import { G2Spec, Mark } from '@antv/g2';

import { ChangePointInfo, InsightInfo } from '../../types';
import { INSIGHT_COLOR_PLATTE } from '../constants';
import { dataFormat } from '../util';

import { pointMarkStrategy } from './augmentedMarks/pointMark';
import { textMarkStrategy } from './augmentedMarks/textMark';
import { insight2ChartStrategy } from './chartStrategy';

export const changePointAugmentedMarksStrategy = (patterns: ChangePointInfo[]): Mark[] => {
  const color = INSIGHT_COLOR_PLATTE.highlight;
  const pointMark = pointMarkStrategy(patterns, { strokeColor: color });
  const textMark = textMarkStrategy(patterns, { formatter: dataFormat });
  return [pointMark, textMark];
};

export const changePointStrategy = (insight: InsightInfo<ChangePointInfo>): G2Spec => {
  const { patterns } = insight;
  const chart = insight2ChartStrategy(insight);
  const augmentedMarks = changePointAugmentedMarksStrategy(patterns);
  return {
    ...chart,
    ...augmentedMarks,
  };
};
