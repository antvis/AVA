import { splitAngleColor } from '../../visual-encoder/split-fields';

import type { Data } from '../../../../../../common/types';
import type { Advice, BasicDataPropertyForAdvice } from '../../../../../types';

export function pieChart(data: Data, dataProps: BasicDataPropertyForAdvice[]): Advice['spec'] {
  const [field4Color, field4Angle] = splitAngleColor(dataProps);
  if (!field4Angle || !field4Color) return null;

  const spec: Advice['spec'] = {
    type: 'interval',
    data,
    encode: {
      color: field4Color.name,
      y: field4Angle.name,
    },
    transform: [{ type: 'stackY' }],
    coordinate: { type: 'theta' },
  };
  return spec;
}

export function donutChart(data: Data, dataProps: BasicDataPropertyForAdvice[]): Advice['spec'] {
  const [field4Color, field4Angle] = splitAngleColor(dataProps);
  if (!field4Angle || !field4Color) return null;

  const spec: Advice['spec'] = {
    type: 'interval',
    data,
    encode: {
      color: field4Color.name,
      y: field4Angle.name,
    },
    transform: [{ type: 'stackY' }],
    coordinate: { type: 'theta', innerRadius: 0.6 },
  };
  return spec;
}
