import { find } from 'lodash';

import { getLineSize } from '../../chart-recommend/encode/utils';

import type { Datum } from '@ava/common/types';
import type { Advice } from '@advisor-deprecated/types';
import type { GenerateChartSpecParams } from '../types';

export function lineChart({ data, dataProps, encode }: GenerateChartSpecParams): Advice['spec'] {
  const [field4X, field4Y, field4Color] = [encode.x?.[0], encode.y?.[0], encode.color?.[0]];
  if (!field4X || !field4Y) return null;

  const spec: Advice['spec'] = {
    type: 'line',
    data,
    encode: {
      x: field4X,
      y: field4Y,
      size: (datum: Datum) => getLineSize(datum, data, { field4X: find(dataProps, ['name', field4X]) }),
    },
    legend: {
      size: false,
    },
  };

  if (field4Color) {
    spec.encode.color = field4Color;
  }

  return spec;
}

export function stepLineChart({ data, dataProps, encode }: GenerateChartSpecParams): Advice['spec'] {
  const spec = lineChart({ data, dataProps, encode });
  if (spec?.encode) {
    spec.encode.shape = 'hvh';
  }
  return spec;
}
