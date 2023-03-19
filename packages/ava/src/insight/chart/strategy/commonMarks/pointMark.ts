import { Mark } from '@antv/g2';

import { PointPatternInfo } from '../../../types';
import { INSIGHT_COLOR_PLATTE } from '../../constants';
import { PointMarkConfig } from '../../types';

/** get mark for point patterns, the patterns should have same dimension and measure */
export const pointMarkStrategy = (patterns: PointPatternInfo[], config: PointMarkConfig): Mark => {
  const { strokeColor, fillColor = INSIGHT_COLOR_PLATTE.defaultPointColor } = config;
  const { dimension, measure } = patterns[0];
  const data = patterns.map((pattern) => ({
    [dimension]: pattern.x,
    [measure]: pattern.y,
  }));
  const pointMark: Mark = {
    type: 'point',
    encode: {
      x: dimension,
      y: measure,
    },
    data,
    style: {
      fill: fillColor,
      stroke: strokeColor,
    },
  };
  return pointMark;
};
