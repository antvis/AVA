import {
  max,
  maxIndex,
  mean,
  min,
  minIndex,
  quantile,
  standardDeviation,
  sum,
  variance,
  valueMap as statsValueMap,
} from '../../statistics';
import {
  isBasicType,
  isBoolean,
  isDate,
  isDateString,
  isFloatString,
  isInteger,
  isIntegerString,
  isNil,
  isNumber,
  isNumberString,
  isString,
  unique,
} from '../../utils';

import type { CkbTypes } from '../../../ckb';
import type { DateFieldInfo, FieldInfo, FieldMeta, NumberFieldInfo, StringFieldInfo, FieldType } from './types';

/**
 * Check if it is StringFieldInfo.
 */
export function isStringFieldInfo(x: FieldInfo): x is StringFieldInfo {
  return x.recommendation === 'string';
}

/**
 * Check if it is NumberFieldInfo.
 */
export function isNumberFieldInfo(x: FieldInfo): x is NumberFieldInfo {
  return x.recommendation === 'integer' || x.recommendation === 'float';
}

/**
 * Check if it is DateFieldInfo.
 */
export function isDateFieldInfo(x: FieldInfo): x is DateFieldInfo {
  return x.recommendation === 'date';
}

/**
 * Checks if field is constant
 * @param info - The {@link FieldInfo} to process
 */
export function isConst(info: FieldInfo): boolean {
  return info.distinct === 1;
}

/**
 * Checks if field is an ordinal.
 * @param info - Field Info
 */
export function isOrdinal(info: FieldInfo): boolean {
  const { rawData, recommendation } = info;
  if (recommendation !== 'string') return false;
  if (isConst(info)) return false;
  const list = rawData.filter((item) => !isNil(item) && isBasicType(item));
  if (list.length === 0) return false;
  let start: null | string = null;
  let end: null | string = null;
  let startIndex = -1;
  let endIndex = -1;

  let through = true;
  while (through) {
    let through = true;
    for (let i = 0; i < list.length; i += 1) {
      const item = list[i];
      const char = item[startIndex + 1];
      if (start === null || i === 0) start = char;
      if (char !== start) {
        through = false;
        break;
      }
    }
    if (!through) break;
    startIndex += 1;
  }
  through = true;
  while (through) {
    let through = true;
    for (let i = 0; i < list.length; i += 1) {
      const item = list[i];
      const char = item[item.length - 1 - (endIndex + 1)];
      if (end === null || i === 0) end = char;
      if (char !== end) {
        through = false;
        break;
      }
    }
    if (!through) break;
    endIndex += 1;
  }
  const patterns = [/\d+/, /(零|一|二|三|四|五|六|七|八|九|十)+/, /(一|二|三|四|五|六|日)/, /^[a-z]$/, /^[A-Z]$/];
  if (startIndex === -1 && endIndex === -1) return false;
  const arr = list.map((item) =>
    item.slice(startIndex === -1 ? 0 : startIndex + 1, endIndex === -1 ? undefined : item.length - endIndex - 1)
  );
  for (let i = 0; i < patterns.length; i += 1) {
    const p = patterns[i];
    const notMatch = arr.some((item) => !p.test(item));
    if (!notMatch) return true;
  }
  return false;
}

/**
 * Checks if field is an unique.
 * @param info - The {@link FieldInfo} to process
 */
export function isUnique(info: FieldInfo): boolean {
  return info.distinct === info.count;
}

/**
 * Checks if field is discrete.
 * @remarks
 * @param info - The {@link FieldInfo} to process
 */
export function isDiscrete(info: FieldInfo): boolean {
  return info.recommendation === 'integer';
}

/**
 * Checks if field is a continuous.
 * @param info - The {@link FieldInfo} to process
 */
export function isContinuous(info: FieldInfo): boolean {
  return info.recommendation === 'float';
}

/**
 * Checks if field is an interval.
 * @param info - The {@link FieldInfo} to process
 */
export function isInterval(info: FieldInfo): boolean {
  return info.recommendation === 'integer' || info.recommendation === 'float';
}

/**
 * Checks if field is a nominal.
 * @param info - The {@link FieldInfo} to process
 */
export function isNominal(info: FieldInfo): boolean {
  if (info.recommendation === 'boolean') return true;
  if (info.recommendation === 'string') return !isOrdinal(info);
  return false;
}

/**
 * Checks if field is a time.
 * @param info - Field Info
 */
export function isTime(info: FieldInfo): boolean {
  return info.recommendation === 'date';
}

/**
 * Analyze string field info.
 * @param value - data
 */
export function analyzeString(value: string[]): Omit<StringFieldInfo, keyof FieldInfo> {
  const lenArray = value.map((item) => item.length);
  return {
    maxLength: max(lenArray),
    minLength: min(lenArray),
    meanLength: mean(lenArray),
    containsChar: value.some((item) => /[A-z]/.test(item)),
    containsDigit: value.some((item) => /[0-9]/.test(item)),
    containsSpace: value.some((item) => /\s/.test(item)),
  };
}

/**
 * Analyze number field info.
 * @param value - data
 */
export function analyzeNumber(value: number[]): Omit<NumberFieldInfo, keyof FieldInfo> {
  return {
    minimum: min(value),
    maximum: max(value),
    mean: mean(value),
    percentile5: quantile(value, 5),
    percentile25: quantile(value, 25),
    percentile50: quantile(value, 50),
    percentile75: quantile(value, 75),
    percentile95: quantile(value, 95),
    sum: sum(value),
    variance: variance(value),
    standardDeviation: standardDeviation(value),
    zeros: value.filter((item) => item === 0).length,
  };
}

/**
 * Analyze date field info.
 * @param value - data
 */
export function analyzeDate(value: (string | Date)[], isInteger = false): Omit<DateFieldInfo, keyof FieldInfo> {
  const list: number[] = value.map((item) => {
    if (isInteger) {
      const str = `${item}`;
      if (str.length === 8)
        return new Date(`${str.substring(0, 4)}/${str.substring(4, 2)}/${str.substring(6, 2)}`).getTime();
    }
    return new Date(item).getTime();
  });
  return {
    minimum: value[minIndex(list)],
    maximum: value[maxIndex(list)],
  };
}

/**
 * Determine what type a value is, may be one of [integer float date string null].
 */
export function analyzeType(value: unknown): 'null' | 'integer' | 'float' | 'date' | 'string' {
  if (isNil(value)) return 'null';
  if (isNumber(value)) {
    if (isInteger(value)) return 'integer';
    return 'float';
  }
  if (isString(value)) {
    if (isNumberString(value)) {
      if ((value as string).includes('.')) return 'float';
      return 'integer';
    }
  }
  if (isDate(value) || isDateString(value)) return 'date';
  return 'string';
}

/**
 * Analyze field info.
 * @param value - data
 * @public
 */
export function analyzeField(value: unknown[]): StringFieldInfo | NumberFieldInfo | DateFieldInfo {
  const list = value.map((item) => (isNil(item) ? null : item));
  const valueMap = statsValueMap(list);
  let recommendation: FieldType;
  const nonNullArray = valueMap.null ? list.filter((item) => item !== null) : list;
  const typeArray = list.map((item) => analyzeType(item));
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
      if (types.includes('integer') && types.includes('float')) recommendation = 'float';
      else recommendation = 'string';
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
        meta.date = analyzeField(restNotNullArray.filter((item) => isDateString(item))) as DateFieldInfo;
        restNotNullArray = restNotNullArray.filter((item) => !isDateString(item));
      } else if (item === 'integer') {
        meta.integer = analyzeField(restNotNullArray.filter((item) => isIntegerString(item))) as NumberFieldInfo;
        restNotNullArray = restNotNullArray.filter((item) => !isIntegerString(item));
      } else if (item === 'float') {
        meta.float = analyzeField(restNotNullArray.filter((item) => isFloatString(item))) as NumberFieldInfo;
        restNotNullArray = restNotNullArray.filter((item) => !isFloatString(item));
      } else if (item === 'string') {
        meta.string = analyzeField(
          restNotNullArray.filter((item) => analyzeType(item) === 'string')
        ) as StringFieldInfo;
        restNotNullArray = restNotNullArray.filter((item) => analyzeType(item) !== 'string');
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

  const levelOfMeasurements: CkbTypes.LevelOfMeasurement[] = [];

  if (isNominal(fieldInfo)) levelOfMeasurements.push('Nominal');
  if (isOrdinal(fieldInfo)) levelOfMeasurements.push('Ordinal');
  if (isInterval(fieldInfo)) levelOfMeasurements.push('Interval');
  if (isDiscrete(fieldInfo)) levelOfMeasurements.push('Discrete');
  if (isContinuous(fieldInfo)) levelOfMeasurements.push('Continuous');
  if (isTime(fieldInfo)) levelOfMeasurements.push('Time');

  fieldInfo.levelOfMeasurements = levelOfMeasurements;

  return fieldInfo as StringFieldInfo | NumberFieldInfo | DateFieldInfo;
}
