import { hasSubset } from '../../../../../utils';

import type { Data } from '../../../../../../common/types';
import type { BasicDataPropertyForAdvice, Advice } from '../../../../../types';

export function histogram(data: Data, dataProps: BasicDataPropertyForAdvice[]): Advice['spec'] {
  const field = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Interval']));
  if (!field) return null;

  const spec: Advice['spec'] = {
    type: 'rect',
    data,
    encode: {
      x: field.name,
    },
    transform: [{ type: 'binX', y: 'count' }],
  };

  return spec;
}
