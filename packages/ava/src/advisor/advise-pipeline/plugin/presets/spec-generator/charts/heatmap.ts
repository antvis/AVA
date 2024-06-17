import { intersects, compare, hasSubset } from '../../../../../utils';

import type { Data } from '../../../../../../common/types';
import type { BasicDataPropertyForAdvice, Advice } from '../../../../../types';

export function heatmap(data: Data, dataProps: BasicDataPropertyForAdvice[]): Advice['spec'] {
  const axisFields = dataProps.filter((field) => intersects(field.levelOfMeasurements, ['Nominal', 'Ordinal']));
  const sortedFields = axisFields.sort(compare);
  const field4X = sortedFields[0];
  const field4Y = sortedFields[1];
  const field4Color = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Interval']));

  if (!field4X || !field4Y || !field4Color) return null;

  const spec: Advice['spec'] = {
    type: 'cell',
    data,
    encode: {
      x: field4X.name,
      y: field4Y.name,
      color: field4Color.name,
    },
  };

  return spec;
}
