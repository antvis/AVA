import { RectMark } from '@antv/g2';

import { PointPatternInfo, IntervalMarkConfig } from '@ava/types';
import { INSIGHT_COLOR_PALETTE } from '@ava/constants';

/** get mark for point patterns, the patterns should have same dimension and measure */
export const intervalMarkStrategy = (patterns: PointPatternInfo[], config?: IntervalMarkConfig): RectMark => {
  const data = patterns.map(({ x, y }) => ({ x, y }));

  const intervalMark: RectMark = {
    type: 'interval',
    data,
    encode: {
      x: 'x',
      y: 'y',
    },
    ...config,
    style: {
      ...config?.style,
      fill: INSIGHT_COLOR_PALETTE.outlier,
    },
  };
  return intervalMark;
};
