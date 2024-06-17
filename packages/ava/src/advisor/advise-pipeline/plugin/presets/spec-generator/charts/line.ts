import { splitLineXY } from '../../visual-encoder/split-fields';
import { getLineSize } from '../../visual-encoder/utils';

import type { Data, Datum } from '../../../../../../common/types';
import type { Advice, BasicDataPropertyForAdvice } from '../../../../../types';

export function lineChart(data: Data, dataProps: BasicDataPropertyForAdvice[]): Advice['spec'] {
  const [field4X, field4Y, field4Color] = splitLineXY(dataProps);
  if (!field4X || !field4Y) return null;

  const spec: Advice['spec'] = {
    type: 'line',
    data,
    encode: {
      x: field4X.name,
      y: field4Y.name,
      size: (datum: Datum) => getLineSize(datum, data, { field4X }),
    },
    legend: {
      size: false,
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
      size: (datum: Datum) => getLineSize(datum, data, { field4X }),
    },
    legend: {
      size: false,
    },
  };

  if (field4Color) {
    spec.encode.color = field4Color.name;
  }

  return spec;
}
