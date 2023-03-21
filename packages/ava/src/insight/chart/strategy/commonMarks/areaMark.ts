import { Mark } from '@antv/g2';

import { AreaMarkData, AreaMarkConfig } from '../../types';

export const areaMarkStrategy = (data: AreaMarkData, { encode, style, tooltip }: AreaMarkConfig): Mark => {
  const common: Mark = {
    style,
    tooltip,
  };

  if (data) {
    return {
      ...common,
      type: 'area',
      data,
      encode: {
        x: 'x',
        y: 'y',
        ...encode,
      },
    };
  }

  return null;
};
