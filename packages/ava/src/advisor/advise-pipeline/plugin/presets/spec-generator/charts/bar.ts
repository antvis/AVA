import { splitBarXYSeries } from '../../visual-encoder/split-fields';
import { mapFieldsToVisualEncode } from '../../visual-encoder/encode-mapping';
import { barEncodeRequirement } from '../../../../../../ckb/encode';

import type { Advice } from '../../../../../types';
import type { GenerateChartSpecParams } from '../types';

export function barChart({ data, dataProps, encode: customEncode }: GenerateChartSpecParams): Advice['spec'] {
  const encode =
    customEncode ?? mapFieldsToVisualEncode({ fields: dataProps, encodeRequirements: barEncodeRequirement });
  const [field4X, field4Y, field4Color] = [encode.x?.[0], encode.y?.[0], encode.color?.[0]];

  if (!field4X || !field4Y) return null;

  const spec: Advice['spec'] = {
    type: 'interval',
    data,
    // G2's implementation converts column chart (vertical bar) and bar chart (horizontal bar) by transpose, so the x and y fields need to be swapped.
    // 由于g2的实现是通过transpose来转换 column chart（竖着的bar）和bar chart（横着的bar），所以x和y的字段需要做交换
    encode: {
      x: field4Y,
      y: field4X,
    },
    coordinate: {
      transform: [{ type: 'transpose' }],
    },
  };

  if (field4Color) {
    spec.encode.color = field4Color;
    spec.transform = [{ type: 'stackY' }];
  }

  return spec;
}

export function groupedBarChart({ data, dataProps, encode }: GenerateChartSpecParams): Advice['spec'] {
  const spec = barChart({ data, dataProps, encode });

  if (spec?.encode?.color) {
    spec.transform = [{ type: 'dodgeX' }];
  }
  return spec;
}

export function stackedBarChart({ data, dataProps, encode }: GenerateChartSpecParams): Advice['spec'] {
  return barChart({ data, dataProps, encode });
}

export function percentStackedBarChart({ data, dataProps, encode }: GenerateChartSpecParams): Advice['spec'] {
  const [field4X, field4Y, field4Series] = splitBarXYSeries(dataProps);
  if (!field4X || !field4Y || !field4Series) return null;
  const spec = barChart({ data, dataProps, encode });
  if (spec?.transform) {
    spec.transform.push({ type: 'normalizeY' });
  } else {
    spec.transform = [{ type: 'normalizeY' }];
  }
  return spec;
}
