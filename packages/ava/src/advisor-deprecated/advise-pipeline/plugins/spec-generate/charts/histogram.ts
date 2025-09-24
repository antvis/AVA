import type { Advice } from '@advisor-deprecated/types';
import type { GenerateChartSpecParams } from '../types';

export function histogram({ data, encode }: GenerateChartSpecParams): Advice['spec'] {
  const field = encode.x?.[0];
  if (!field) return null;

  const spec: Advice['spec'] = {
    type: 'rect',
    data,
    encode: {
      x: field,
    },
    transform: [{ type: 'binX', y: 'count' }],
  };

  return spec;
}
