import { filter } from 'lodash';

import { pearson } from '../../data';
import { BasicDataPropertyForAdvice } from '../ruler';

export const findTopCorrFields = (fields: BasicDataPropertyForAdvice[]) => {
  const intervalFields = filter(fields, (field) => field.levelOfMeasurements.includes('Interval'));
  if (intervalFields.length < 3) {
    return {
      x: intervalFields[0],
      y: intervalFields[1],
    };
  }
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

  return { x: triple.x, y: triple.y, size: triple.size };
};
