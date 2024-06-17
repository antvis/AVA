import { hasSubset, intersects } from '../../../../../utils';
import { splitAreaXYSeries } from '../../visual-encoder/split-fields';
import { getLineSize } from '../../visual-encoder/utils';

import type { Data, Datum } from '../../../../../../common/types';
import type { Advice, BasicDataPropertyForAdvice } from '../../../../../types';

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
      size: (datum: Datum) => getLineSize(datum, data, { field4X }),
    },
    legend: {
      size: false,
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
      size: (datum: Datum) => getLineSize(datum, data, { field4Split: field4Series, field4X }),
    },
    legend: {
      size: false,
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
