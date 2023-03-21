import { Mark } from '@antv/g2';

import { INSIGHT_COLOR_PLATTE } from '../../constants';
import { LineMarkConfig, LineMarkData } from '../../types';

export const lineMarkStrategy = (
  { points, x, y }: LineMarkData,
  { encode, style, label, tooltip }: LineMarkConfig
): Mark => {
  const common: Mark = {
    style: {
      lineDash: [2, 2],
      stroke: INSIGHT_COLOR_PLATTE.highlight,
      ...style,
    },
    labels: label
      ? [
          {
            text: label,
            selector: 'last',
            position: 'right',
            style: {
              textBaseline: 'bottom',
              textAlign: 'end',
              dy: -24,
            },
          },
        ]
      : undefined,
    tooltip,
  };

  if (points) {
    return {
      ...common,
      type: 'line',
      data: points,
      encode: {
        x: 'x',
        y: 'y',
        ...encode,
      },
    };
  }

  if (x) {
    return {
      ...common,
      type: 'lineX',
      data: [x],
    };
  }

  if (y) {
    return {
      ...common,
      type: 'lineY',
      data: [y],
    };
  }
  return null;
};
