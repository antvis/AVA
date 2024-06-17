import { mapFieldsToVisualEncode } from '../../visual-encoder/encode-mapping';
import { histogramEncodeRequirement } from '../../../../../../ckb/encode';

import type { Advice } from '../../../../../types';
import type { GenerateChartSpecParams } from '../types';

export function histogram({ data, dataProps, encode: customEncode }: GenerateChartSpecParams): Advice['spec'] {
  const encode =
    customEncode ?? mapFieldsToVisualEncode({ fields: dataProps, encodeRequirements: histogramEncodeRequirement });
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
