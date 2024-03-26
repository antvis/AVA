import { hasSubset, intersects } from '../../../utils';
import { splitAreaXYSeries } from '../splitFields';

import type { Data } from '../../../../common/types';
import type { Advice, BasicDataPropertyForAdvice } from '../../../types';

export function areaChart(data: Data, dataProps: BasicDataPropertyForAdvice[]): Advice['spec'] {
  const field4X = dataProps.find((field) => intersects(field.levelOfMeasurements, ['Time', 'Ordinal']));
  const field4Y = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Interval']));

  if (!field4X || !field4Y) return null;

  const spec: Advice['spec'] = {
    type: 'area',
    data,
    encode: {
      x: field4X.name,
      y: field4Y.name,
    },
  };

  return spec;
}

export function stackedAreaChart(data: Data, dataProps: BasicDataPropertyForAdvice[]): Advice['spec'] {
  const [field4X, field4Y, field4Series] = splitAreaXYSeries(dataProps);
  if (!field4X || !field4Y || !field4Series) return null;

  const spec: Advice['spec'] = {
    type: 'area',
    data,
    encode: {
      x: field4X.name,
      y: field4Y.name,
      color: field4Series.name,
    },
    transform: [{ type: 'stackY' }],
  };

  return spec;
}

export function percentStackedAreaChart(data: Data, dataProps: BasicDataPropertyForAdvice[]): Advice['spec'] {
  const [field4X, field4Y, field4Series] = splitAreaXYSeries(dataProps);
  if (!field4X || !field4Y || !field4Series) return null;

  const spec: Advice['spec'] = {
    type: 'area',
    data,
    encode: {
      x: field4X.name,
      y: field4Y.name,
      color: field4Series.name,
    },
    transform: [{ type: 'stackY' }, { type: 'normalizeY' }],
  };

  return spec;
}
