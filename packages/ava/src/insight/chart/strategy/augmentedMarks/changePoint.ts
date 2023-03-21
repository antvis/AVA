import { Mark } from '@antv/g2';

import { ChangePointInfo, InsightInfo } from '../../../types';
import { INSIGHT_COLOR_PLATTE } from '../../constants';
import { dataFormat } from '../../../../utils';
import { pointMarkStrategy } from '../commonMarks/pointMark';
import { textMarkStrategy } from '../commonMarks/textMark';
import { insight2ChartStrategy } from '../chart';

export const changePointAugmentedMarksStrategy = (insight: InsightInfo<ChangePointInfo>): Mark[] => {
  const { patterns } = insight;
  const color = INSIGHT_COLOR_PLATTE.highlight;
  const { measure } = patterns?.[0];
  const pointMark = pointMarkStrategy(patterns, { style: { fill: color } });
  const textMark = textMarkStrategy(patterns, {
    formatter: dataFormat,
    label: (pattern) => `${pattern.x}, ${measure}: ${pattern.y}`,
    style: {
      dy: -20,
      background: true,
      backgroundRadius: 2,
      connector: true,
      startMarker: true,
      startMarkerFill: '#2C3542',
      startMarkerFillOpacity: 0.65,
    },
  });
  return [pointMark, textMark];
};

export const changePointStrategy = (insight: InsightInfo<ChangePointInfo>): Mark[] => {
  const chart = insight2ChartStrategy(insight);
  const augmentedMarks = changePointAugmentedMarksStrategy(insight);
  return [chart, ...augmentedMarks];
};
