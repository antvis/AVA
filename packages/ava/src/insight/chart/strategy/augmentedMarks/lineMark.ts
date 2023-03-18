import { Mark } from '@antv/g2';
import { isFunction } from 'lodash';

import { INSIGHT_COLOR_PLATTE } from '../../constants';
import { LineMarkConfig, LineMarkData } from '../../types';

export const lineMarkStrategy = ({ points, x, y }: LineMarkData, { style, label }: LineMarkConfig): Mark => {
  const common: Mark = {
    style: {
      lineDash: [2, 2],
      stroke: INSIGHT_COLOR_PLATTE.highlight,
      ...style,
    },
    labels: [
      {
        text: isFunction(label) ? (d) => label(d) : label,
        selector: 'last',
        position: 'right',
        style: {
          textBaseline: 'bottom',
          textAlign: 'end',
          dy: -8,
        },
      },
    ],
  };

  if (points) {
    return {
      ...common,
      type: 'line',
      data: points,
      encode: {
        x: (point) => point[0],
        y: (point) => point[1],
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
