import { Data } from '../../../../common/types';
import { Advice, BasicDataPropertyForAdvice } from '../../../types';
import { compare, hasSubset } from '../../../utils';
import { splitColumnXYSeries } from '../splitFields';

export function columnChart(data: Data, dataProps: BasicDataPropertyForAdvice[]): Advice['spec'] {
  const nominalFields = dataProps.filter((field) => hasSubset(field.levelOfMeasurements, ['Nominal']));
  const sortedNominalFields = nominalFields.sort(compare);
  const field4X = sortedNominalFields[0];
  const field4Color = sortedNominalFields[1];
  const field4Y = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Interval']));

  if (!field4X || !field4Y) return null;

  const spec: Advice['spec'] = {
    type: 'interval',
    data,
    encode: {
      x: field4X.name,
      y: field4Y.name,
    },
  };

  if (field4Color) {
    spec.encode.color = field4Color.name;
    spec.transform = [{ type: 'stackY' }];
  }

  return spec;
}

export function groupedColumnChart(data: Data, dataProps: BasicDataPropertyForAdvice[]): Advice['spec'] {
  const [field4X, field4Y, field4Series] = splitColumnXYSeries(dataProps);
  if (!field4X || !field4Y || !field4Series) return null;

  const spec: Advice['spec'] = {
    type: 'interval',
    data,
    encode: {
      x: field4X.name,
      y: field4Y.name,
      color: field4Series.name,
    },
    transform: [{ type: 'dodgeX' }],
  };

  return spec;
}

export function stackedColumnChart(data: Data, dataProps: BasicDataPropertyForAdvice[]): Advice['spec'] {
  const [field4X, field4Y, Field4Series] = splitColumnXYSeries(dataProps);
  if (!field4X || !field4Y || !Field4Series) return null;

  const spec: Advice['spec'] = {
    type: 'interval',
    data,
    encode: {
      x: field4X.name,
      y: field4Y.name,
      color: Field4Series.name,
    },
    transform: [{ type: 'stackY' }],
  };

  return spec;
}

export function percentStackedColumnChart(data: Data, dataProps: BasicDataPropertyForAdvice[]): Advice['spec'] {
  const [field4X, field4Y, Field4Series] = splitColumnXYSeries(dataProps);
  if (!field4X || !field4Y || !Field4Series) return null;

  const spec: Advice['spec'] = {
    type: 'interval',
    data,
    encode: {
      x: field4X.name,
      y: field4Y.name,
      color: Field4Series.name,
    },
    transform: [{ type: 'stackY' }, { type: 'normalizeY' }],
  };

  return spec;
}
