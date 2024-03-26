import { splitLineXY } from '../splitFields';

import type { Data } from '../../../../common/types';
import type { Advice, BasicDataPropertyForAdvice } from '../../../types';

export function lineChart(data: Data, dataProps: BasicDataPropertyForAdvice[]): Advice['spec'] {
  const [field4X, field4Y, field4Color] = splitLineXY(dataProps);
  if (!field4X || !field4Y) return null;

  const spec: Advice['spec'] = {
    type: 'line',
    data,
    encode: {
      x: field4X.name,
      y: field4Y.name,
    },
  };

  if (field4Color) {
    spec.encode.color = field4Color.name;
  }

  return spec;
}

export function stepLineChart(data: Data, dataProps: BasicDataPropertyForAdvice[]): Advice['spec'] {
  const [field4X, field4Y, field4Color] = splitLineXY(dataProps);
  if (!field4X || !field4Y) return null;

  const spec: Advice['spec'] = {
    type: 'line',
    data,
    encode: {
      x: field4X.name,
      y: field4Y.name,
      shape: 'hvh',
    },
  };

  if (field4Color) {
    spec.encode.color = field4Color.name;
  }

  return spec;
}
