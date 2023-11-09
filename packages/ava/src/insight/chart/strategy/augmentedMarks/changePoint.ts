import { Mark, PointMark, TextMark } from '@antv/g2';
import { size } from 'lodash';

import { ChangePointInfo, InsightInfo } from '../../../types';
import { INSIGHT_COLOR_PLATTE } from '../../constants';
import { dataFormat } from '../../../../utils';
import { pointMarkStrategy } from '../commonMarks/pointMark';
import { textMarkStrategy } from '../commonMarks/textMark';
import { insight2ChartStrategy } from '../chart';
import { ChangePointMark } from '../../types';

const CHANGE_POINT_TEXT_STYLE = {
  dy: -20,
  background: true,
  backgroundRadius: 2,
  connector: true,
  startMarker: true,
  startMarkerFill: '#2C3542',
  startMarkerFillOpacity: 0.65,
};

export const changePointAugmentedMarksStrategy = (insight: InsightInfo<ChangePointInfo>): Mark[] => {
  const { patterns } = insight;
  const color = INSIGHT_COLOR_PLATTE.highlight;
  const { measure } = patterns?.[0];
  const pointMark = pointMarkStrategy(patterns, { style: { fill: color } });
  const textMark = textMarkStrategy(patterns, {
    formatter: dataFormat,
    label: (pattern) => `${pattern.x}, ${measure}: ${pattern.y}`,
    style: CHANGE_POINT_TEXT_STYLE,
  });
  return [pointMark, textMark];
};

export const getAugmentedChangePointMarks = (insight: InsightInfo<ChangePointInfo>): ChangePointMark[] => {
  const { patterns } = insight;
  const color = INSIGHT_COLOR_PLATTE.highlight;

  if (!size(patterns)) return [];

  const { measure } = patterns[0];
  const changePointMarks: ChangePointMark[] = [];
  patterns.forEach((pattern) => {
    const pointMark = pointMarkStrategy([pattern], { style: { fill: color } }) as PointMark;
    const textMark = textMarkStrategy([pattern], {
      formatter: dataFormat,
      label: (pt) => `${pt.x}, ${measure}: ${pt.y}`,
      style: CHANGE_POINT_TEXT_STYLE,
    }) as TextMark;
    changePointMarks.push({
      changePoint: [pointMark, textMark],
    });
  });

  return changePointMarks;
};

export const changePointStrategy = (insight: InsightInfo<ChangePointInfo>): Mark[] => {
  const chart = insight2ChartStrategy(insight);
  const augmentedMarks = changePointAugmentedMarksStrategy(insight);
  return [chart, ...augmentedMarks];
};
