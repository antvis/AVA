import { find } from 'lodash';

import { getLineSize } from '../../visual-encoder/utils';
import { mapFieldsToVisualEncode } from '../../visual-encoder/encode-mapping';
import { areaEncodeRequirement } from '../../../../../../ckb/encode';

import type { Datum } from '../../../../../../common/types';
import type { Advice } from '../../../../../types';
import type { GenerateChartSpecParams } from '../types';

export function areaChart({ data, dataProps, encode: customEncode }: GenerateChartSpecParams): Advice['spec'] {
  const encode =
    customEncode ?? mapFieldsToVisualEncode({ fields: dataProps, encodeRequirements: areaEncodeRequirement });
  const field4X = encode.x?.[0];
  const field4Y = encode.y?.[0];

  if (!field4X || !field4Y) return null;

  const spec: Advice['spec'] = {
    type: 'area',
    data,
    encode: {
      x: field4X,
      y: field4Y,
      size: (datum: Datum) => getLineSize(datum, data, { field4X: find(dataProps, ['name', field4X]) }),
    },
    legend: {
      size: false,
    },
  };

  return spec;
}

export function stackedAreaChart({ data, dataProps, encode: customEncode }: GenerateChartSpecParams): Advice['spec'] {
  const encode =
    customEncode ?? mapFieldsToVisualEncode({ fields: dataProps, encodeRequirements: areaEncodeRequirement });
  const [field4X, field4Y, field4Series] = [encode.x?.[0], encode.y?.[0], encode.color?.[0]];
  if (!field4X || !field4Y) return null;

  const spec: Advice['spec'] = {
    type: 'area',
    data,
    encode: {
      x: field4X,
      y: field4Y,
      size: (datum: Datum) =>
        getLineSize(datum, data, {
          field4Split: find(dataProps, ['name', field4Series]),
          field4X: find(dataProps, ['name', field4X]),
        }),
    },
    legend: {
      size: false,
    },
  };

  if (field4Series) {
    spec.encode.color = field4Series;
    spec.transform = [{ type: 'stackY' }];
  }

  return spec;
}

export function percentStackedAreaChart({ data, dataProps, encode }: GenerateChartSpecParams): Advice['spec'] {
  const spec = stackedAreaChart({ data, dataProps, encode });
  if (spec?.transform) {
    spec.transform.push({ type: 'normalizeY' });
  } else {
    spec.transform = [{ type: 'normalizeY' }];
  }

  return spec;
}
