import { mapFieldsToVisualEncode } from '../../visual-encoder/encode-mapping';
import { scatterEncodeRequirement } from '../../../../../../ckb/encode';

import type { Advice } from '../../../../../types';
import type { GenerateChartSpecParams } from '../types';

export function scatterPlot({ data, dataProps, encode: customEncode }: GenerateChartSpecParams): Advice['spec'] {
  const encode =
    customEncode ?? mapFieldsToVisualEncode({ fields: dataProps, encodeRequirements: scatterEncodeRequirement });
  const [field4X, field4Y, field4Color, field4Size] = [
    encode?.x?.[0],
    encode?.y?.[0],
    encode?.color?.[0],
    encode?.size?.[0],
  ];

  if (!field4X || !field4Y) return null;

  const spec: Advice['spec'] = {
    type: 'point',
    data,
    encode: {
      x: field4X,
      y: field4Y,
    },
  };

  if (field4Color) {
    spec.encode.color = field4Color;
  }

  if (field4Size) {
    spec.encode.size = field4Size;
  }

  return spec;
}

export function bubbleChart({ data, dataProps, encode }: GenerateChartSpecParams): Advice['spec'] {
  return scatterPlot({ data, dataProps, encode });
}
