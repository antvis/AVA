import { columnEncodeRequirement } from '../../../../../../ckb/encode';
import { mapFieldsToVisualEncode } from '../../visual-encoder/encode-mapping';

import type { Advice } from '../../../../../types';
import type { GenerateChartSpecParams } from '../types';

export function columnChart({ data, dataProps, encode: customEncode }: GenerateChartSpecParams): Advice['spec'] {
  const encode =
    customEncode ?? mapFieldsToVisualEncode({ fields: dataProps, encodeRequirements: columnEncodeRequirement });
  const [field4X, field4Y, field4Color] = [encode.x?.[0], encode.y?.[0], encode.color?.[0]];
  if (!field4X || !field4Y) return null;

  const spec: Advice['spec'] = {
    type: 'interval',
    data,
    encode: {
      x: field4X,
      y: field4Y,
    },
  };

  if (field4Color) {
    spec.encode.color = field4Color;
    spec.transform = [{ type: 'stackY' }];
  }

  return spec;
}

export function groupedColumnChart({ data, dataProps, encode }: GenerateChartSpecParams): Advice['spec'] {
  const spec = columnChart({ data, dataProps, encode });
  if (spec?.encode?.color) {
    spec.transform = [{ type: 'dodgeX' }];
  }
  return spec;
}

export function stackedColumnChart({ data, dataProps, encode }: GenerateChartSpecParams): Advice['spec'] {
  return columnChart({ data, dataProps, encode });
}

export function percentStackedColumnChart({ data, dataProps, encode }: GenerateChartSpecParams): Advice['spec'] {
  const spec = columnChart({ data, dataProps, encode });
  if (spec?.transform) {
    spec.transform.push({ type: 'normalizeY' });
  } else {
    spec.transform = [{ type: 'normalizeY' }];
  }
  return spec;
}
