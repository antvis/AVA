import { find } from 'lodash';

import { getLineSize } from '../../visual-encoder/utils';
import { mapFieldsToVisualEncode } from '../../visual-encoder/encode-mapping';
import { lineEncodeRequirement } from '../../../../../../ckb/encode';

import type { Datum } from '../../../../../../common/types';
import type { Advice } from '../../../../../types';
import type { GenerateChartSpecParams } from '../types';

export function lineChart({ data, dataProps, encode: customEncode }: GenerateChartSpecParams): Advice['spec'] {
  const encode =
    customEncode ?? mapFieldsToVisualEncode({ fields: dataProps, encodeRequirements: lineEncodeRequirement });
  const [field4X, field4Y, field4Color] = [encode.x?.[0], encode.y?.[0], encode.color?.[0]];
  if (!field4X || !field4Y) return null;

  const spec: Advice['spec'] = {
    type: 'line',
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

  if (field4Color) {
    spec.encode.color = field4Color;
  }

  return spec;
}

export function stepLineChart({ data, dataProps, encode }: GenerateChartSpecParams): Advice['spec'] {
  const spec = lineChart({ data, dataProps, encode });
  if (spec?.encode) {
    spec.encode.shape = 'hvh';
  }
  return spec;
}
