import { Mark } from '@antv/g2';

import { ChangePointInfo, InsightInfo } from '../../../types';
import { INSIGHT_COLOR_PLATTE } from '../../constants';
import { dataFormat } from '../../../../utils';
import { pointMarkStrategy } from '../commonMarks/pointMark';
import { textMarkStrategy } from '../commonMarks/textMark';
import { insight2ChartStrategy } from '../chart';

export const changePointAugmentedMarksStrategy = (patterns: ChangePointInfo[]): Mark[] => {
  const color = INSIGHT_COLOR_PLATTE.highlight;
  const pointMark = pointMarkStrategy(patterns, { style: { strokeColor: color } });
  const textMark = textMarkStrategy(patterns, { formatter: dataFormat });
  return [pointMark, textMark];
};

export const changePointStrategy = (insight: InsightInfo<ChangePointInfo>, patterns: ChangePointInfo[]): Mark[] => {
  const chart = insight2ChartStrategy(insight);
  const augmentedMarks = changePointAugmentedMarksStrategy(patterns);
  return [chart, ...augmentedMarks];
};
