/**
 * Analysis field type
 *
 * @example
 *
 * ```javascript
 *
 *  import { type }  from '@antv/dw-analyzer';
 *
 *  const a = [1, 2, 3]
 *
 *  const info = type(a);
 * ```
 *
 * @packageDocumentation
 */

import * as Stat from './statistic';
import { unique, assert, isDate, isNull, isFloat, isInteger, removeEmptyRow, intDatePartners, isDigit } from './utils';

/**
 * Determine what type a value is, may be one of [integer float date string null]
 */
function WhatType(source: any): 'null' | 'integer' | 'float' | 'date' | 'string' {
  if (isNull(source)) return 'null';
  if (typeof source === 'number') {
    if (Number.isInteger(source)) return 'integer';
    return 'float';
  }
  if (typeof source === 'string') {
    if (isDigit(source)) {
      if (source.includes('.')) return 'float';
      return 'integer';
    }
  }
  if (isDate(source)) return 'date';
  return 'string';
}

/**
 * String Field
 * @public
 */
export interface StringFieldInfo extends FieldInfo {
  /** max length */
  maxLength: number;
  /** min length */
  minLength: number;
  /** mean of length */
  meanLength: number;
  /** is contain charts */
  containsChars: boolean;
  /**  is contain digits */
  containsDigits: boolean;
  /** is contain white space */
  containsSpace: boolean;
  /** is contain nonworlds */
  containsNonWorlds: boolean;
}

/**
 * Number Field
 * @public
 */
export interface NumberFieldInfo extends FieldInfo {
  /** the counts of zero value */
  zeros: number;
  /** minimum */
  minimum: number;
  /** 5% percentile */
  percentile5: number;
  /** 25% percentile */
  percentile25: number;
  /** 50% percentile */
  percentile50: number;
  /** 75% percentile */
  percentile75: number;
  /** 95% percentile */
  percentile95: number;
  /** maximum */
  maximum: number;
  /** stdev */
  stdev: number;
  /** mean */
  mean: number;
  /** sum */
  sum: number;
  /** variance */
  variance: number;
}

/**
 * Date Field
 * @public
 */
export interface DateFieldInfo extends FieldInfo {
  /** minimum date */
  minimum: string | number | Date;
  /** maximum date */
  maximum: string | number | Date;
}

/**
 * Field Type
 * @public
 */
export type TypeSpecifics = 'null' | 'boolean' | 'integer' | 'float' | 'date' | 'string';

/**
 * basic info of field
 * @public
 */
export interface FieldInfo {
  /** field type */
  type: TypeSpecifics | 'mixed'; // float integer bool date null string mixed
  /** recommendation type */
  recommendation: TypeSpecifics;
  /** number of empty inclues null undefined or empty string */
  missing: number;
  /** Distinct count */
  distinct: number;
  /** Number of each distinct item */
  valueMap: Record<string, number>;
  /** count of samples */
  count: number;
  /** samples */
  samples: any[];
  /** more info */
  meta?: FieldMeta;
}

/**
 * The field meta which be exsit only the Field type is mixed
 * @public
 */
export interface FieldMeta {
  integer?: NumberFieldInfo;
  float?: NumberFieldInfo;
  date?: DateFieldInfo;
  string?: StringFieldInfo;
}

/**
 * Fields Type
 * @public
 */
export type FieldsInfo = Array<FieldInfo & { /** field name */ name: string }>;

function analyzeString(array: string[]): Omit<StringFieldInfo, keyof FieldInfo> {
  const lenArray = array.map((item) => item.length);
  return {
    maxLength: Stat.max(lenArray),
    minLength: Stat.min(lenArray),
    meanLength: Stat.mean(lenArray),
    containsChars: array.some((item) => /[A-z]/.test(item)),
    containsDigits: array.some((item) => /[0-9]/.test(item)),
    containsSpace: array.some((item) => /\s/.test(item)),
    containsNonWorlds: false,
  };
}

function analyzeNumber(array: number[]): Omit<NumberFieldInfo, keyof FieldInfo> {
  return {
    minimum: Stat.min(array),
    maximum: Stat.max(array),
    mean: Stat.mean(array),
    percentile5: Stat.quantile(array, 5),
    percentile25: Stat.quantile(array, 25),
    percentile50: Stat.quantile(array, 50),
    percentile75: Stat.quantile(array, 75),
    percentile95: Stat.quantile(array, 95),
    sum: Stat.sum(array),
    variance: Stat.variance(array),
    stdev: Stat.stdev(array),
    zeros: array.filter((item) => item === 0).length,
  };
}

function analyzeDate(array: Array<string | Date>, isInteger = false): Omit<DateFieldInfo, keyof FieldInfo> {
  const list: number[] = array.map((item) => {
    if (isInteger) {
      const str = `${item}`;
      if (str.length === 8) return new Date(`${str.substr(0, 4)}/${str.substr(4, 2)}/${str.substr(6, 2)}`).getTime();
    }
    return new Date(item).getTime();
  });
  return {
    minimum: array[Stat.minIndex(list)],
    maximum: array[Stat.maxIndex(list)],
  };
}

function isBoolean(source: any[]): boolean {
  return [
    [true, false],
    [0, 1],
    ['true', 'false'],
    ['Yes', 'No'],
    ['True', 'False'],
    ['0', '1'],
    ['是', '否'],
  ].some((list: any[]) => {
    return source.every((item: any) => list.includes(item));
  });
}

const THRESHOLD = 100;

/**
 * Analysis field type
 * @param array - data
 * @public
 */
export function type(array: any[]): FieldInfo {
  const list = array.map((item) => (isNull(item) ? null : item));
  const valueMap = Stat.valueMap(list);
  let recommendation: TypeSpecifics;
  const nonNullArray = valueMap.null ? list.filter((item) => item !== null) : list;
  const typeArray = list.map((item) => WhatType(item));
  const types = Object.keys(Stat.valueMap(typeArray)).filter((item) => item !== 'null') as TypeSpecifics[];

  switch (types.length) {
    case 0:
      recommendation = 'null';
      break;
    case 1:
      recommendation = types[0] as TypeSpecifics;
      // an integer field may be a date field
      if (recommendation === 'integer') {
        const data = list.filter((item) => item !== null);
        for (let i = 0; i < intDatePartners.length; i++) {
          const p = intDatePartners[i];
          if (!data.some((item) => !p.test(item))) {
            recommendation = 'date';
            break;
          }
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
    count: array.length,
    distinct: uniqueArray.length,
    type: types.length <= 1 ? types[0] || 'null' : 'mixed',
    recommendation,
    missing: valueMap.null || 0,
    samples: array,
    valueMap,
  };

  if (types.length > 1) {
    const meta: FieldMeta = {};
    types.forEach((item: string) => {
      if (item === 'date') {
        meta.date = type(nonNullArray.filter(isDate)) as DateFieldInfo;
      } else if (item === 'integer') {
        meta.integer = type(nonNullArray.filter(isInteger)) as NumberFieldInfo;
      } else if (item === 'float') {
        meta.float = type(nonNullArray.filter(isFloat)) as NumberFieldInfo;
      } else if (item === 'string') {
        meta.string = type(nonNullArray.filter((item) => WhatType(item) === 'string')) as StringFieldInfo;
      }
    });
    fieldInfo.meta = meta;
  }

  if (fieldInfo.distinct === 2 && fieldInfo.recommendation !== 'date') {
    if (list.length >= THRESHOLD) {
      fieldInfo.recommendation = 'boolean';
    } else {
      if (isBoolean(uniqueArray)) {
        fieldInfo.recommendation = 'boolean';
      }
    }
  }

  if (recommendation === 'string') {
    Object.assign(fieldInfo, analyzeString(nonNullArray.map((item) => `${item}`)));
  }
  if (recommendation === 'integer' || recommendation === 'float') {
    Object.assign(fieldInfo, analyzeNumber(nonNullArray.map((item) => item * 1)));
  }
  if (recommendation === 'date') {
    Object.assign(fieldInfo, analyzeDate(nonNullArray, fieldInfo.type === 'integer'));
  }

  return fieldInfo;
}

/**
 * Analyze the type of all fields in an array
 * @param array - data
 * @param fields - the fields which you need to analyze
 * @public
 */
export function typeAll(array: Record<string, any>[], fields?: string[]): FieldsInfo {
  assert(fields && fields.length === 0, 'fields.length woudle greater than 0');
  if (!fields) {
    const keySet = new Set<string>();
    array.forEach((item) => Object.keys(item).forEach((k) => keySet.add(k)));
    fields = [...keySet];
  }
  return fields.map((key) => {
    return { ...type(array.map((item) => item[key as any])), name: key };
  });
}

/**
 * Checks if field is an ordinal
 * @param info - Field Info
 * @public
 */

export function isOrdinal(info: FieldInfo): boolean {
  const { samples, recommendation } = info;
  if (recommendation !== 'string') return false;
  if (isConst(info)) return false;
  const list = samples.filter((item) => !isNull(item));
  let start: null | string = null;
  let end: null | string = null;
  let startIndex = -1;
  let endIndex = -1;
  while (true) {
    let through = true;
    for (let i = 0; i < list.length; i++) {
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
  while (true) {
    let through = true;
    for (let i = 0; i < list.length; i++) {
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
  const partners = [/\d+/, /(零|一|二|三|四|五|六|七|八|九|十)+/, /(一|二|三|四|五|六|日)/, /^[a-z]$/, /^[A-Z]$/];
  if (startIndex === -1 && endIndex === -1) return false;
  const arr = list.map((item) =>
    item.slice(startIndex === -1 ? 0 : startIndex + 1, endIndex === -1 ? undefined : item.length - endIndex - 1)
  );
  for (let i = 0; i < partners.length; i++) {
    const p = partners[i];
    const notMatch = arr.some((item) => !p.test(item));
    if (!notMatch) return true;
  }
  return false;
}

/**
 * Checks if field is constant
 * @param info - The {@link FieldInfo} to processs
 * @public
 */
export function isConst(info: FieldInfo): boolean {
  return info.distinct === 1;
}

/**
 * Checks if field is an unique
 * @param info - The {@link FieldInfo} to processs
 * @public
 */
export function isUnique(info: FieldInfo): boolean {
  return info.distinct === info.count;
}

/**
 * Checks if field is discrete
 * @remarks
 * @param info - The {@link FieldInfo} to processs
 * @public
 */
export function isDiscrete(info: FieldInfo): boolean {
  return info.recommendation === 'integer';
}

/**
 * Checks if field is a continuous.
 * @param info - The {@link FieldInfo} to processs
 * @public
 */
export function isContinuous(info: FieldInfo): boolean {
  return info.recommendation === 'float';
}

/**
 * Checks if field is an interval
 * @param info - The {@link FieldInfo} to processs
 * @public
 */
export function isInterval(info: FieldInfo): boolean {
  return info.recommendation === 'integer' || info.recommendation === 'float';
}

/**
 * Checks if field is a nominal
 * @param info - The {@link FieldInfo} to processs
 * @public
 */
export function isNominal(info: FieldInfo): boolean {
  if (info.recommendation === 'boolean') return true;
  if (info.recommendation === 'string') return !isOrdinal(info);
  return false;
}

/**
 * Checks if field is a time
 * @param info - Field Info
 * @public
 */
export function isTime(info: FieldInfo): boolean {
  return info.recommendation === 'date';
}

/**
 * Return the Pearson CorrelationCoefficient of two Field
 * @param info1 - The {@link FieldInfo} to processs
 * @param info2 - Another {@link FieldInfo} to processs
 * @public
 */
export function pearson(info1: FieldInfo, info2: FieldInfo): number {
  const types = ['integer', 'float'];
  assert(
    !(types.includes(info1.recommendation) && types.includes(info2.recommendation)),
    `field's type must be integer or float`
  );
  const x = info1.samples;
  const y = info2.samples;
  const [newx, newy] = removeEmptyRow(x, y);
  return Stat.pearson(newx.map(Number.parseFloat), newy.map(Number.parseFloat));
}
