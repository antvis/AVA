import { Mark } from '@antv/g2';

import { COLOR } from '../../constants';
import { LineMarkConfig } from '../../types';

export const lineMarkStrategy = ({ lineY, lineX, points, style, label }: LineMarkConfig): Mark => {
  const common: Mark = {
    style: {
      lineDash: [2, 2],
      stroke: COLOR.highlight,
      ...style,
    },
    labels: [
      {
        text: label,
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

  if (lineX) {
    return {
      ...common,
      type: 'lineX',
      data: [lineX],
    };
  }

  if (lineY) {
    return {
      ...common,
      type: 'lineY',
      data: [lineY],
    };
  }
  return null;
};
