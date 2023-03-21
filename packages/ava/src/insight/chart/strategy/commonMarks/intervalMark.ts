import { Mark } from '@antv/g2';

import { PointPatternInfo } from '../../../types';
import { INSIGHT_COLOR_PLATTE } from '../../constants';
import { IntervalMarkConfig } from '../../types';

/** get mark for point patterns, the patterns should have same dimension and measure */
export const intervalMarkStrategy = (patterns: PointPatternInfo[], config?: IntervalMarkConfig): Mark => {
  const data = patterns.map(({ x, y }) => ({ x, y }));

  const intervalMark: Mark = {
    type: 'interval',
    data,
    encode: {
      x: 'x',
      y: 'y',
    },
    ...config,
    style: {
      ...config?.style,
      fill: INSIGHT_COLOR_PLATTE.outlier,
    },
  };
  return intervalMark;
};
