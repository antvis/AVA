import { mapFieldsToVisualEncode } from '../../visual-encoder/encode-mapping';
import { heatmapEncodeRequirement } from '../../../../../../ckb/encode';

import type { Advice } from '../../../../../types';
import type { GenerateChartSpecParams } from '../types';

export function heatmap({ data, dataProps, encode: customEncode }: GenerateChartSpecParams): Advice['spec'] {
  const encode =
    customEncode ?? mapFieldsToVisualEncode({ fields: dataProps, encodeRequirements: heatmapEncodeRequirement });
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
