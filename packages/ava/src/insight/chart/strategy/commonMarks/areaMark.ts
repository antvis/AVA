import { AreaMark } from '@antv/g2';

import { AreaMarkData, AreaMarkConfig } from '../../types';

export const areaMarkStrategy = (data: AreaMarkData, { encode, style, tooltip }: AreaMarkConfig): AreaMark => {
  const common: AreaMark = {
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
