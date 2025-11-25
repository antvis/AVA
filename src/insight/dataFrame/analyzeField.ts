import { LevelOfMeasurement } from '../../types';
import {
  analyzeDate,
  analyzeNumber,
  analyzeString,
  analyzeType,
  isContinuous,
  isDiscrete,
  isInterval,
  isNominal,
  isOrdinal,
  isTime,
} from '../../extract/features';
import { isBoolean, isDateString, isFloatString, isIntegerString, isNil, unique } from '../../utils';
import { DateFieldInfo, FieldInfo, FieldMeta, FieldType, NumberFieldInfo, StringFieldInfo } from '../types';

/**
 * Calculate the counts of each distinct value in the array.
 * @param value - The array to process
 */
export function statsValueMap(value: unknown[]): Record<string, number> {
  const data: Record<string | number, number> = {};
  value.forEach((v) => {
    const vStr = `${v}`;
    if (data[vStr]) data[vStr] += 1;
    else data[vStr] = 1;
  });
  return data;
}

/**
 * Analyze field info.
 * @param value - data
 * @public
 */
export function analyzeField(
  value: unknown[],
  strictDatePattern?: boolean
): StringFieldInfo | NumberFieldInfo | DateFieldInfo {
  const list = value.map((item) => (isNil(item) ? null : item));
  const valueMap = statsValueMap(list);
  let recommendation: FieldType;
  const nonNullArray = valueMap.null ? list.filter((item) => item !== null) : list;
  const typeArray = list.map((item) => analyzeType(item, strictDatePattern));
  const types = Object.keys(statsValueMap(typeArray)).filter((item) => item !== 'null') as FieldType[];

  // generate recommendation
  switch (types.length) {
    case 0:
      recommendation = 'null';
      break;
    case 1:
      recommendation = types[0] as FieldType;
      // an integer field may be a date field
      if (recommendation === 'integer') {
        const data = list.filter((item) => item !== null);
        if (data.map((num) => `${num}`).every((str) => isDateString(str))) {
          recommendation = 'date';
        }
      }
      break;
    case 2:
      if ((types.includes('integer') || types.includes('date')) && types.includes('float')) {
        recommendation = 'float';
        break;
      }
      if (types.includes('integer') && types.includes('date')) {
        // an integer field may be a date field
        const data = list.filter((item) => item !== null);
        if (data.map((num) => `${num}`).every((str) => isDateString(str))) {
          recommendation = 'date';
        } else {
          recommendation = 'integer';
        }
        break;
      }
      recommendation = 'string';
      break;
    default:
      recommendation = 'string';
  }

  const uniqueArray = unique(nonNullArray);

  const fieldInfo: FieldInfo = {
    count: value.length,
    distinct: uniqueArray.length,
    type: types.length <= 1 ? types[0] || 'null' : 'mixed',
    recommendation,
    missing: valueMap.null || 0,
    rawData: value,
    valueMap,
  };

  if (types.length > 1) {
    const meta: FieldMeta = {};
    let restNotNullArray = nonNullArray;
    types.forEach((item: string) => {
      if (item === 'date') {
        meta.date = analyzeField(
          restNotNullArray.filter((item) => isDateString(item)),
          strictDatePattern
        ) as DateFieldInfo;
        restNotNullArray = restNotNullArray.filter((item) => !isDateString(item));
      } else if (item === 'integer') {
        meta.integer = analyzeField(
          restNotNullArray.filter((item) => isIntegerString(item) && !isDateString(item)),
          strictDatePattern
        ) as NumberFieldInfo;
        restNotNullArray = restNotNullArray.filter((item) => !isIntegerString(item));
      } else if (item === 'float') {
        meta.float = analyzeField(
          restNotNullArray.filter((item) => isFloatString(item) && !isDateString(item)),
          strictDatePattern
        ) as NumberFieldInfo;
        restNotNullArray = restNotNullArray.filter((item) => !isFloatString(item));
      } else if (item === 'string') {
        meta.string = analyzeField(
          restNotNullArray.filter((item) => analyzeType(item, strictDatePattern) === 'string')
        ) as StringFieldInfo;
        restNotNullArray = restNotNullArray.filter((item) => analyzeType(item, strictDatePattern) !== 'string');
      }
    });
    fieldInfo.meta = meta;
  }

  if (fieldInfo.distinct === 2 && fieldInfo.recommendation !== 'date') {
    // temporarily threshold
    if (list.length >= 100) {
      fieldInfo.recommendation = 'boolean';
    } else if (isBoolean(uniqueArray, true)) {
      fieldInfo.recommendation = 'boolean';
    }
  }

  if (recommendation === 'string') {
    Object.assign(fieldInfo, analyzeString(nonNullArray.map((item) => `${item}`)));
  }
  if (recommendation === 'integer' || recommendation === 'float') {
    Object.assign(fieldInfo, analyzeNumber(nonNullArray.map((item) => (item as number) * 1)));
  }
  if (recommendation === 'date') {
    Object.assign(fieldInfo, analyzeDate(nonNullArray as (string | Date)[], fieldInfo.type === 'integer'));
  }

  const levelOfMeasurements: LevelOfMeasurement[] = [];

  if (isNominal(fieldInfo)) levelOfMeasurements.push('Nominal');
  if (isOrdinal(fieldInfo)) levelOfMeasurements.push('Ordinal');
  if (isInterval(fieldInfo)) levelOfMeasurements.push('Interval');
  if (isDiscrete(fieldInfo)) levelOfMeasurements.push('Discrete');
  if (isContinuous(fieldInfo)) levelOfMeasurements.push('Continuous');
  if (isTime(fieldInfo)) levelOfMeasurements.push('Time');

  fieldInfo.levelOfMeasurements = levelOfMeasurements;

  return fieldInfo as StringFieldInfo | NumberFieldInfo | DateFieldInfo;
}
