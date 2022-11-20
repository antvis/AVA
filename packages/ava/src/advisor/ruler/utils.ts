import { intersects } from '../utils';

import type { CkbTypes } from '../../ckb';
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

export function verifyDataProps(
  dataPre: CkbTypes.ChartKnowledge['dataPres'][number],
  dataProps: BasicDataPropertyForAdvice[]
) {
  const fieldsLOMs: CkbTypes.LevelOfMeasurement[][] = dataProps.map((info: any) => {
    return info.levelOfMeasurements as CkbTypes.LevelOfMeasurement[];
  });
  if (fieldsLOMs) {
    let lomCount = 0;
    fieldsLOMs.forEach((fieldLOM) => {
      if (fieldLOM && intersects(fieldLOM, dataPre.fieldConditions)) {
        lomCount += 1;
      }
    });
    if (lomCount >= dataPre.minQty && (lomCount <= dataPre.maxQty || dataPre.maxQty === '*')) {
      return true;
    }
  }
  return false;
}

export function isUndefined(value: any) {
  return value === undefined;
}
