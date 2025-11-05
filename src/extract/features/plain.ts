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
import { COLUMN_TYPE } from '../../types/data';
import type {
  DateColumnFeature,
  ColumnFeature,
  ColumnMeta,
  NumberColumnFeature,
  StringColumnFeature,
  LevelOfMeasurement,
} from '../../types/data';

/**
 * Check if it is StringColumnFeature.
 */
export function isStringColumnFeature(x: ColumnFeature): x is StringColumnFeature {
  return x.recommendation === COLUMN_TYPE.string;
}

/**
 * Check if it is NumberColumnFeature.
 */
export function isNumberColumnFeature(x: ColumnFeature): x is NumberColumnFeature {
  return x.recommendation === COLUMN_TYPE.number;
}

/**
 * Check if it is DateColumnFeature.
 */
export function isDateColumnFeature(x: ColumnFeature): x is DateColumnFeature {
  return x.recommendation === COLUMN_TYPE.date;
}

/**
 * Checks if field is constant
 * @param info - The {@link ColumnFeature} to process
 */
export function isConst(info: ColumnFeature): boolean {
  return info.distinct === 1;
}

/**
 * Checks if field is an ordinal.
 * @param info - Field Info
 */
export function isOrdinal(info: ColumnFeature): boolean {
  const { rawData, recommendation } = info;
  if (recommendation === COLUMN_TYPE.number) return false;
  if (isConst(info)) return false;
  const list = rawData.filter((item) => !isNil(item) && isBasicType(item)).map((item) => `${item}`);
  if (list.length === 0) return false;
  // Compute common prefix and suffix lengths safely to avoid infinite loops
  const minLen = Math.min(...list.map((s) => s.length));
  let startIndex = -1;
  for (let idx = 0; idx < minLen; idx += 1) {
    const c0 = list[0][idx];
    const allSame = list.every((s) => s[idx] === c0);
    if (!allSame) break;
    startIndex = idx;
  }
  let endIndex = -1;
  for (let idx = 0; idx < minLen; idx += 1) {
    const c0 = list[0][list[0].length - 1 - idx];
    const allSame = list.every((s) => s[s.length - 1 - idx] === c0);
    if (!allSame) break;
    endIndex = idx;
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
 * @param info - The {@link ColumnFeature} to process
 */
export function isUnique(info: ColumnFeature): boolean {
  return info.distinct === info.count;
}

/**
 * Checks if field is discrete.
 * @remarks
 * @param info - The {@link ColumnFeature} to process
 */
export function isDiscrete(info: ColumnFeature): boolean {
  return info.recommendation === COLUMN_TYPE.number;
}

/**
 * Checks if field is a continuous.
 * @param info - The {@link ColumnFeature} to process
 */
export function isContinuous(info: ColumnFeature): boolean {
  return info.recommendation === COLUMN_TYPE.number;
}

/**
 * Checks if field is an interval.
 * @param info - The {@link ColumnFeature} to process
 */
export function isInterval(info: ColumnFeature): boolean {
  return info.recommendation === COLUMN_TYPE.number;
}

/**
 * Checks if field is a nominal.
 * @param info - The {@link ColumnFeature} to process
 */
export function isNominal(info: ColumnFeature): boolean {
  if (info.recommendation === COLUMN_TYPE.boolean) return true;
  if (info.recommendation === COLUMN_TYPE.string) return !isOrdinal(info);
  return false;
}

/**
 * Checks if field is a time.
 * @param info - Field Info
 */
export function isTime(info: ColumnFeature): boolean {
  return info.recommendation === COLUMN_TYPE.date;
}

/**
 * Analyze string field info.
 * @param value - data
 */
export function analyzeString(value: string[]): Omit<StringColumnFeature, keyof ColumnFeature> {
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
export function analyzeNumber(value: number[]): Omit<NumberColumnFeature, keyof ColumnFeature> {
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
export function analyzeDate(value: (string | Date)[], isInteger = false): Omit<DateColumnFeature, keyof ColumnFeature> {
  const list: number[] = value.map((item) => {
    if (isInteger) {
      const str = `${item}`;
      if (str.length === 8)
        return new Date(`${str.substring(0, 4)}/${str.substring(4, 2)}/${str.substring(6, 2)}`).getTime();
    }
    return new Date(item).getTime();
  });
  const imin = minIndex(list);
  const imax = maxIndex(list);
  const minimum = value[imin];
  const maximum = value[imax];
  return { minimum, maximum };
}

/**
 * Determine what type a value is, may be one of [number number date string null].
 */
export function analyzeType(value: unknown, strictDatePattern?: boolean): COLUMN_TYPE {
  if (isNil(value)) return COLUMN_TYPE.null;
  if (isNumber(value)) {
    if (isInteger(value)) return COLUMN_TYPE.number;
    return COLUMN_TYPE.number;
  }
  // 优先识别日期类型，避免字符型日期被判断成字符
  if (isDate(value) || isDateString(value, strictDatePattern)) return COLUMN_TYPE.date;
  if (isString(value)) {
    if (isNumberString(value)) {
      if ((value as string).includes('.')) return COLUMN_TYPE.number;
      return COLUMN_TYPE.number;
    }
  }
  if (isBoolean(value)) {
    return COLUMN_TYPE.boolean;
  }
  return COLUMN_TYPE.string;
}

/**
 * Analyze field info.
 * @param value - data
 * @public
 */
export function analyzeField(
  value: unknown[],
  strictDatePattern?: boolean
): StringColumnFeature | NumberColumnFeature | DateColumnFeature {
  const list = value.map((item) => (isNil(item) ? null : item));
  const valueMap = statsValueMap(list);
  let recommendation: COLUMN_TYPE;
  const nonNullArray = valueMap.null ? list.filter((item) => item !== null) : list;
  const typeArray = list.map((item) => analyzeType(item, strictDatePattern));
  const types = Object.keys(statsValueMap(typeArray)).filter((item) => item !== 'null') as COLUMN_TYPE[];
  // generate recommendation
  switch (types.length) {
    case 0:
      recommendation = COLUMN_TYPE.null;
      break;
    case 1:
      // 单一类型
      recommendation = types[0] as COLUMN_TYPE;
      // an number field may be a date field
      if (recommendation === COLUMN_TYPE.number) {
        const data = list.filter((item) => item !== null);
        if (data.map((num) => `${num}`).every((str) => isDateString(str))) {
          recommendation = COLUMN_TYPE.date;
        }
      }
      break;
    case 2:
      if (types.includes(COLUMN_TYPE.number) && types.includes(COLUMN_TYPE.date)) {
        // an number field may be a date field
        const data = list.filter((item) => item !== null);
        if (data.map((num) => `${num}`).every((str) => isDateString(str))) {
          recommendation = COLUMN_TYPE.date;
        } else {
          recommendation = COLUMN_TYPE.number;
        }
        break;
      }
      recommendation = COLUMN_TYPE.string;
      break;
    default:
      recommendation = COLUMN_TYPE.string;
  }

  const uniqueArray = unique(nonNullArray as string[]);

  const columnFeature: ColumnFeature = {
    count: value.length,
    distinct: uniqueArray[1].length,
    types,
    recommendation,
    missing: valueMap.null || 0,
    rawData: value,
    valueMap,
  };

  if (types.length > 1) {
    const meta: ColumnMeta = {};
    let restNotNullArray = nonNullArray;
    types.forEach((item: string) => {
      if (item === COLUMN_TYPE.date) {
        meta.date = analyzeField(
          restNotNullArray.filter((item) => isDateString(item)),
          strictDatePattern
        ) as DateColumnFeature;
        restNotNullArray = restNotNullArray.filter((item) => !isDateString(item));
      } else if (item === COLUMN_TYPE.number) {
        // TODO: @思莫 跟下面的一个是小数一个是整数？
        meta.number = analyzeField(
          restNotNullArray.filter((item) => isIntegerString(item) && !isDateString(item)),
          strictDatePattern
        ) as NumberColumnFeature;
        restNotNullArray = restNotNullArray.filter((item) => !isIntegerString(item));
      } else if (item === COLUMN_TYPE.number) {
        meta.number = analyzeField(
          restNotNullArray.filter((item) => isFloatString(item) && !isDateString(item)),
          strictDatePattern
        ) as NumberColumnFeature;
        restNotNullArray = restNotNullArray.filter((item) => !isFloatString(item));
      } else if (item === COLUMN_TYPE.string) {
        meta.string = analyzeField(
          restNotNullArray.filter((item) => analyzeType(item, strictDatePattern) === COLUMN_TYPE.string)
        ) as StringColumnFeature;
        restNotNullArray = restNotNullArray.filter(
          (item) => analyzeType(item, strictDatePattern) !== COLUMN_TYPE.string
        );
      }
    });
  }

  if (columnFeature.distinct === 2 && columnFeature.recommendation !== 'date') {
    // temporarily threshold
    if (list.length >= 100) {
      columnFeature.recommendation = COLUMN_TYPE.boolean;
    } else if (isBoolean(uniqueArray, true)) {
      columnFeature.recommendation = COLUMN_TYPE.boolean;
    }
  }

  if (recommendation === COLUMN_TYPE.string) {
    Object.assign(columnFeature, analyzeString(nonNullArray.map((item) => `${item}`)));
  }
  if (recommendation === COLUMN_TYPE.number) {
    Object.assign(columnFeature, analyzeNumber(nonNullArray.map((item) => (item as number) * 1)));
  }
  if (recommendation === COLUMN_TYPE.date) {
    Object.assign(
      columnFeature,
      analyzeDate(nonNullArray as (string | Date)[], columnFeature.types.includes(COLUMN_TYPE.number))
    );
  }

  const levelOfMeasurements: LevelOfMeasurement[] = [];

  if (isNominal(columnFeature)) levelOfMeasurements.push('Nominal');
  if (isOrdinal(columnFeature)) levelOfMeasurements.push('Ordinal');
  if (isInterval(columnFeature)) levelOfMeasurements.push('Interval');
  if (isDiscrete(columnFeature)) levelOfMeasurements.push('Discrete');
  if (isContinuous(columnFeature)) levelOfMeasurements.push('Continuous');
  if (isTime(columnFeature)) levelOfMeasurements.push('Time');

  columnFeature.levelOfMeasurements = levelOfMeasurements;

  return columnFeature as StringColumnFeature | NumberColumnFeature | DateColumnFeature;
}
