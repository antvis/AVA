import { Mark } from '@antv/g2';

import { PointPatternInfo } from '../../../types';
import { PointMarkConfig } from '../../types';

/** get mark for point patterns, the patterns should have same dimension and measure */
export const pointMarkStrategy = (patterns: PointPatternInfo[], config: PointMarkConfig): Mark => {
  const data = patterns.map(({ x, y }) => ({ x, y }));

  const pointMark: Mark = {
    type: 'point',
    data,
    encode: {
      x: 'x',
      y: 'y',
    },
    ...config,
  };
  return pointMark;
};
