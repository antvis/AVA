import { intersects } from '../utils';

import type { LevelOfMeasurement as LOM, DataPrerequisite } from '../../ckb/types';
import type { BasicDataPropertyForAdvice } from './type';

export function compare(f1: any, f2: any) {
  if (f1.distinct < f2.distinct) {
    return 1;
  }
  if (f1.distinct > f2.distinct) {
    return -1;
  }

  return 0;
}

export function verifyDataProps(dataPre: DataPrerequisite, dataProps: BasicDataPropertyForAdvice[]) {
  const fieldsLOMs: LOM[][] = dataProps.map((info: any) => {
    return info.levelOfMeasurements as LOM[];
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
