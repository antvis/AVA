import { intersects } from '../utils';

import type { ChartKnowledge, LevelOfMeasurement } from '../../ckb';
import type { BasicDataPropertyForAdvice } from './types';

export function compare(f1: any, f2: any) {
  if (f1.distinct < f2.distinct) {
    return 1;
  }
  if (f1.distinct > f2.distinct) {
    return -1;
  }

  return 0;
}

export function verifyDataProps(dataPre: ChartKnowledge['dataPres'][number], dataProps: BasicDataPropertyForAdvice[]) {
  const fieldsLOMs: LevelOfMeasurement[][] = dataProps.map((info: any) => {
    return info.levelOfMeasurements as LevelOfMeasurement[];
  });
  if (fieldsLOMs) {
    let lomCount = 0;
    fieldsLOMs.forEach((fieldLOM) => {
      if (fieldLOM && intersects(fieldLOM, dataPre.fieldConditions)) {
        lomCount += 1;
      }
    });
    if (lomCount >= dataPre.minQty && (dataPre.maxQty === '*' || lomCount <= dataPre.maxQty)) {
      return true;
    }
  }
  return false;
}

export function isUndefined(value: any) {
  return value === undefined;
}
