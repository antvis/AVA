import type { Advice } from '@advisor-deprecated/types';
import type { GenerateChartSpecParams } from '../types';

export function heatmap({ data, encode }: GenerateChartSpecParams): Advice['spec'] {
  const field4X = encode?.x?.[0];
  const field4Y = encode?.y?.[0];
  const field4Color = encode?.color?.[0];

  if (!field4X || !field4Y || !field4Color) return null;

  const spec: Advice['spec'] = {
    type: 'cell',
    data,
    encode: {
      x: field4X,
      y: field4Y,
      color: field4Color,
    },
  };

  return spec;
}
