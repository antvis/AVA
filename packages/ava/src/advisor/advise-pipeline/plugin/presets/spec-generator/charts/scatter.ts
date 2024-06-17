import { pearson } from '../../../../../../data';
import { hasSubset, compare, intersects } from '../../../../../utils';

import type { BasicDataPropertyForAdvice, Advice } from '../../../../../types';
import type { Data } from '../../../../../../common/types';

export function scatterPlot(data: Data, dataProps: BasicDataPropertyForAdvice[]): Advice['spec'] {
  const intervalFields = dataProps.filter((field) => hasSubset(field.levelOfMeasurements, ['Interval']));
  const sortedIntervalFields = intervalFields.sort(compare);
  const field4X = sortedIntervalFields[0];
  const field4Y = sortedIntervalFields[1];
  const field4Color = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Nominal']));

  if (!field4X || !field4Y) return null;

  const spec: Advice['spec'] = {
    type: 'point',
    data,
    encode: {
      x: field4X.name,
      y: field4Y.name,
    },
  };

  if (field4Color) {
    spec.encode.color = field4Color.name;
  }

  return spec;
}

export function bubbleChart(data: Data, dataProps: BasicDataPropertyForAdvice[]): Advice['spec'] {
  const intervalFields = dataProps.filter((field) => hasSubset(field.levelOfMeasurements, ['Interval']));

  const triple = {
    x: intervalFields[0],
    y: intervalFields[1],
    corr: 0,
    size: intervalFields[2],
  };
  for (let i = 0; i < intervalFields.length; i += 1) {
    for (let j = i + 1; j < intervalFields.length; j += 1) {
      const p = pearson(intervalFields[i].rawData, intervalFields[j].rawData);
      if (Math.abs(p) > triple.corr) {
        triple.x = intervalFields[i];
        triple.y = intervalFields[j];
        triple.corr = p;
        triple.size = intervalFields[[...Array(intervalFields.length).keys()].find((e) => e !== i && e !== j) || 0];
      }
    }
  }

  const field4X = triple.x;
  const field4Y = triple.y;
  const field4Size = triple.size;

  const field4Color = dataProps.find((field) => intersects(field.levelOfMeasurements, ['Nominal']));

  // require x,y,size,color at the same time
  if (!field4X || !field4Y || !field4Size) return null;

  const spec: Advice['spec'] = {
    type: 'point',
    data,
    encode: {
      x: field4X.name,
      y: field4Y.name,
      size: field4Size.name,
    },
  };

  if (field4Color) {
    spec.encode.color = field4Color.name;
  }

  return spec;
}
