import type { LevelOfMeasurement } from '../../../ckb';

/**
 * Field Type
 * @public
 */
export type FieldType = 'null' | 'boolean' | 'integer' | 'float' | 'date' | 'string';

/**
 * The field meta which be existed only the Field type is mixed
 */
export type FieldMeta = {
  integer?: NumberFieldInfo;
  float?: NumberFieldInfo;
  date?: DateFieldInfo;
  string?: StringFieldInfo;
};

/**
 * Basic info of field
 * @public
 */
export type FieldInfo = {
  /** field name */
  name?: string;
  /** field type */
  type: FieldType | 'mixed'; // float integer bool date null string mixed
  /** recommendation type */
  recommendation: FieldType;
  /** number of empty includes null undefined or empty string */
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
};

/**
 * String Field
 * @public
 */
export type StringFieldInfo = FieldInfo & {
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
};

/**
 * Number Field
 * @public
 */
export type NumberFieldInfo = FieldInfo & {
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
};

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
