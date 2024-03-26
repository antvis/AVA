import { splitBarXYSeries } from '../splitFields';

import type { Data } from '../../../../common/types';
import type { Advice, BasicDataPropertyForAdvice } from '../../../types';

export function barChart(data: Data, dataProps: BasicDataPropertyForAdvice[]): Advice['spec'] {
  const [field4X, field4Y, field4Color] = splitBarXYSeries(dataProps);

  if (!field4X || !field4Y) return null;

  const spec: Advice['spec'] = {
    type: 'interval',
    data,
    // G2's implementation converts column chart (vertical bar) and bar chart (horizontal bar) by transpose, so the x and y fields need to be swapped.
    // 由于g2的实现是通过transpose来转换 column chart（竖着的bar）和bar chart（横着的bar），所以x和y的字段需要做交换
    encode: {
      x: field4Y.name,
      y: field4X.name,
    },
    coordinate: {
      transform: [{ type: 'transpose' }],
    },
  };

  if (field4Color) {
    spec.encode.color = field4Color.name;
    spec.transform = [{ type: 'stackY' }];
  }

  return spec;
}

export function groupedBarChart(data: Data, dataProps: BasicDataPropertyForAdvice[]): Advice['spec'] {
  const [field4X, field4Y, field4Series] = splitBarXYSeries(dataProps);
  if (!field4X || !field4Y || !field4Series) return null;

  const spec: Advice['spec'] = {
    type: 'interval',
    data,
    encode: {
      x: field4Y.name,
      y: field4X.name,
      color: field4Series.name,
    },
    transform: [{ type: 'dodgeX' }],
    coordinate: {
      transform: [{ type: 'transpose' }],
    },
  };

  return spec;
}

export function stackedBarChart(data: Data, dataProps: BasicDataPropertyForAdvice[]): Advice['spec'] {
  const [field4X, field4Y, field4Series] = splitBarXYSeries(dataProps);
  if (!field4X || !field4Y || !field4Series) return null;

  const spec: Advice['spec'] = {
    type: 'interval',
    data,
    encode: {
      x: field4Y.name,
      y: field4X.name,
      color: field4Series.name,
    },
    transform: [{ type: 'stackY' }],
    coordinate: {
      transform: [{ type: 'transpose' }],
    },
  };

  return spec;
}

export function percentStackedBarChart(data: Data, dataProps: BasicDataPropertyForAdvice[]): Advice['spec'] {
  const [field4X, field4Y, field4Series] = splitBarXYSeries(dataProps);
  if (!field4X || !field4Y || !field4Series) return null;

  const spec: Advice['spec'] = {
    type: 'interval',
    data,
    encode: {
      x: field4Y.name,
      y: field4X.name,
      color: field4Series.name,
    },
    transform: [{ type: 'stackY' }, { type: 'normalizeY' }],
    coordinate: {
      transform: [{ type: 'transpose' }],
    },
  };

  return spec;
}
