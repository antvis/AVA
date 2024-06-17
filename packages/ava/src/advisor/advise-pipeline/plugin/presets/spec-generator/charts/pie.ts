import { mapFieldsToVisualEncode } from '../../visual-encoder/encode-mapping';
import { pieEncodeRequirement } from '../../../../../../ckb/encode';

import type { Advice } from '../../../../../types';
import type { GenerateChartSpecParams } from '../types';

export function pieChart({ data, dataProps, encode: customEncode }: GenerateChartSpecParams): Advice['spec'] {
  const encode =
    customEncode ?? mapFieldsToVisualEncode({ fields: dataProps, encodeRequirements: pieEncodeRequirement });
  const [field4Angle, field4Color] = [encode.y?.[0], encode.color?.[0]];
  if (!field4Angle || !field4Color) return null;

  const spec: Advice['spec'] = {
    type: 'interval',
    data,
    encode: {
      color: field4Color,
      y: field4Angle,
    },
    transform: [{ type: 'stackY' }],
    coordinate: { type: 'theta' },
  };
  return spec;
}

export function donutChart({ data, dataProps, encode }: GenerateChartSpecParams): Advice['spec'] {
  const spec = pieChart({ data, dataProps, encode });
  if (spec?.coordinate?.type === 'theta') {
    spec.coordinate.innerRadius = 0.6;
  }
  return spec;
}
