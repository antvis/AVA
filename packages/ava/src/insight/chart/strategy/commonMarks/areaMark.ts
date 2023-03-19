import { Mark } from '@antv/g2';

import { AreaMarkData, AreaMarkConfig } from '../../types';

export const areaMarkStrategy = (data: AreaMarkData, { style, tooltip }: AreaMarkConfig): Mark => {
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
        x: (data) => data[0],
        y: (data) => data[1],
      },
    };
  }

  return null;
};
