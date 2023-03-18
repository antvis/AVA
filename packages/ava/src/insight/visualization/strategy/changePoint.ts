import { G2Spec, Mark } from '@antv/g2';

import { ChangePointInfo, InsightInfo } from '../../types';
import { COLOR } from '../constants';

import { pointMarkStrategy } from './augmentedMarks/pointMark';
import { textMarkStrategy } from './augmentedMarks/textMark';
import { insight2ChartStrategy } from './basicCharts';

export const changePointAugmentedMarksStrategy = (patterns: ChangePointInfo[]): Mark[] => {
  const color = COLOR.highlight;
  const pointMark = pointMarkStrategy(patterns, { strokeColor: color });
  const textMark = textMarkStrategy(patterns);
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
