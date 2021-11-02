import * as utils from '../utils';
import * as statistics from '../statistics';
import { isDateString } from './is-date';
import type { LevelOfMeasurement } from '@antv/ckb';

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
  /** field name */
  name?: string;
  /** field type */
  type: TypeSpecifics | 'mixed'; // float integer bool date null string mixed
  /** recommendation type */
  recommendation: TypeSpecifics;
  /** number of empty inclues null undefined or empty string */
  missing?: number;
  /** distinct count */
  distinct?: number;
  /** Number of each distinct item */
  valueMap?: Record<string, number>;
  /** count of rawData */
  count?: number;
  /** rawData */
  rawData: any[];
  /** more info */
  meta?: FieldMeta;
  /** level of measurements */
  levelOfMeasurements?: LevelOfMeasurement[];
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
  containsChar: boolean;
  /**  is contain digits */
  containsDigit: boolean;
  /** is contain white space */
  containsSpace: boolean;
}

/**
 * @public
 */
export function isStringFieldInfo(x: FieldInfo): x is StringFieldInfo {
  return x.recommendation === 'string';
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
  /** standardDeviation */
  standardDeviation: number;
  /** mean */
  mean: number;
  /** sum */
  sum: number;
  /** variance */
  variance: number;
}

/**
 * @public
 */
export function isNumberFieldInfo(x: FieldInfo): x is NumberFieldInfo {
  return x.recommendation === 'integer' || x.recommendation === 'float';
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
 * @public
 */
export function isDateFieldInfo(x: FieldInfo): x is DateFieldInfo {
  return x.recommendation === 'date';
}

/**
 * The field meta which be exsit only the Field type is mixed
 * @public
 */
export type FieldMeta = {
  integer?: NumberFieldInfo;
  float?: NumberFieldInfo;
  date?: DateFieldInfo;
  string?: StringFieldInfo;
};

export type NodeStructFeat = {
  degree: number;
  inDegree: number;
  outDegree: number;
  pageRank: number;
  closeness: number;
  kCore: number;
  cycleCount: number;
  triangleCount: number;
  starCount: number;
  cliqueCount: number;
  clusterCoeff: number;
};

export type LinkStructFeat = {
  isDirected: Boolean;
  centrality: number;
  cycleCount: number;
  triangleCount: number;
  starCount: number;
  cliqueCount: number;
};
// Statistical features of graph
export type GraphFeat = {
  nodeCount: number;
  linkCount: number;
  direction: number;
  isDirected: Boolean;
  isDAG: Boolean;
  isCycle: Boolean;
  isConnected: Boolean;
  ratio: number; // ratio of breadth to depth
  breadth: number;
  depth: number;
  maxDegree: number;
  minDegree: number;
  avgDegree: number;
  degreeStd: number;
  maxPageRank: number;
  minPageRank: number;
  avgPageRank: number;
  components: any[];
  componentCount: number;
  strongConnectedComponents: any[];
  strongConnectedComponentCount: number;
  cycleCount: number;
  directedCycleCount: number;
  starCount: number;
  cliqueCount: number;
  cycleParticipate: number;
  triangleCount: number;
  localClusterCoeff: number;
  globalClusterCoeff: number;
  maxKCore: number;
};

export type GraphProps = {
  nodeFeats: FieldInfo[];
  linkFeats: FieldInfo[];
  graphInfo: Partial<GraphFeat>;
  nodeFieldsInfo: FieldInfo[];
  linkFieldsInfo: FieldInfo[];
  [key: string]: any;
};

export function analyzeString(array: string[]): Omit<StringFieldInfo, keyof FieldInfo> {
  const lenArray = array.map((item) => item.length);
  return {
    maxLength: statistics.max(lenArray),
    minLength: statistics.min(lenArray),
    meanLength: statistics.mean(lenArray),
    containsChar: array.some((item) => /[A-z]/.test(item)),
    containsDigit: array.some((item) => /[0-9]/.test(item)),
    containsSpace: array.some((item) => /\s/.test(item)),
  };
}

export function analyzeNumber(array: number[]): Omit<NumberFieldInfo, keyof FieldInfo> {
  return {
    minimum: statistics.min(array),
    maximum: statistics.max(array),
    mean: statistics.mean(array),
    percentile5: statistics.quantile(array, 5),
    percentile25: statistics.quantile(array, 25),
    percentile50: statistics.quantile(array, 50),
    percentile75: statistics.quantile(array, 75),
    percentile95: statistics.quantile(array, 95),
    sum: statistics.sum(array),
    variance: statistics.variance(array),
    standardDeviation: statistics.standardDeviation(array),
    zeros: array.filter((item) => item === 0).length,
  };
}

export function analyzeDate(array: Array<string | Date>, isInteger = false): Omit<DateFieldInfo, keyof FieldInfo> {
  const list: number[] = array.map((item) => {
    if (isInteger) {
      const str = `${item}`;
      if (str.length === 8) return new Date(`${str.substr(0, 4)}/${str.substr(4, 2)}/${str.substr(6, 2)}`).getTime();
    }
    return new Date(item).getTime();
  });
  return {
    minimum: array[statistics.minIndex(list)],
    maximum: array[statistics.maxIndex(list)],
  };
}

/**
 * Determine what type a value is, may be one of [integer float date string null]
 */
export function analyzeType(value: any): 'null' | 'integer' | 'float' | 'date' | 'string' {
  if (utils.isNull(value)) return 'null';
  if (utils.isNumber(value)) {
    if (utils.isInteger(value)) return 'integer';
    return 'float';
  }
  if (utils.isString(value)) {
    if (utils.isDigit(value)) {
      if (value.includes('.')) return 'float';
      return 'integer';
    }
  }
  if (utils.isDate(value, true)) return 'date';
  return 'string';
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
 * Checks if field is an ordinal
 * @param info - Field Info
 * @public
 */
export function isOrdinal(info: FieldInfo): boolean {
  const { rawData, recommendation } = info;
  if (recommendation !== 'string') return false;
  if (isConst(info)) return false;
  const list = rawData.filter((item) => !utils.isNull(item) && utils.isBasicType(item));
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
  const partners = [/\d+/, /(零|一|二|三|四|五|六|七|八|九|十)+/, /(一|二|三|四|五|六|日)/, /^[a-z]$/, /^[A-Z]$/];
  if (startIndex === -1 && endIndex === -1) return false;
  const arr = list.map((item) =>
    item.slice(startIndex === -1 ? 0 : startIndex + 1, endIndex === -1 ? undefined : item.length - endIndex - 1)
  );
  for (let i = 0; i < partners.length; i += 1) {
    const p = partners[i];
    const notMatch = arr.some((item) => !p.test(item));
    if (!notMatch) return true;
  }
  return false;
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
 * Analysis field type
 * @param array - data
 * @public
 */
export function analyzeField(array: any[]): StringFieldInfo | NumberFieldInfo | DateFieldInfo {
  const list = array.map((item) => (utils.isNull(item) ? null : item));
  const valueMap = statistics.valueMap(list);
  let recommendation: TypeSpecifics;
  const nonNullArray = valueMap.null ? list.filter((item) => item !== null) : list;
  const typeArray = list.map((item) => analyzeType(item));
  const types = Object.keys(statistics.valueMap(typeArray)).filter((item) => item !== 'null') as TypeSpecifics[];

  // generate recommendation
  switch (types.length) {
    case 0:
      recommendation = 'null';
      break;
    case 1:
      recommendation = types[0] as TypeSpecifics;
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

  const uniqueArray = utils.unique(nonNullArray);

  const fieldInfo: FieldInfo = {
    count: array.length,
    distinct: uniqueArray.length,
    type: types.length <= 1 ? types[0] || 'null' : 'mixed',
    recommendation,
    missing: valueMap.null || 0,
    rawData: array,
    valueMap,
  };

  if (types.length > 1) {
    const meta: FieldMeta = {};
    let restNotNullArray = nonNullArray;
    types.forEach((item: string) => {
      if (item === 'date') {
        meta.date = analyzeField(restNotNullArray.filter((item) => utils.isDate(item, true))) as DateFieldInfo;
        restNotNullArray = restNotNullArray.filter((item) => !utils.isDate(item, true));
      } else if (item === 'integer') {
        meta.integer = analyzeField(restNotNullArray.filter((item) => utils.isInteger(item, true))) as NumberFieldInfo;
        restNotNullArray = restNotNullArray.filter((item) => !utils.isInteger(item, true));
      } else if (item === 'float') {
        meta.float = analyzeField(restNotNullArray.filter((item) => utils.isFloat(item, true))) as NumberFieldInfo;
        restNotNullArray = restNotNullArray.filter((item) => !utils.isFloat(item, true));
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
    } else if (utils.isBoolean(uniqueArray, true)) {
      fieldInfo.recommendation = 'boolean';
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
