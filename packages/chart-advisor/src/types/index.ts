import { LevelOfMeasurement as LOM } from '@antv/ckb';
import { analyzer as DWAnalyzer } from '@antv/data-wizard';

/**
 * return type of data to data props, describe data column
 * @public
 */
export type DataProperty =
  | (DWAnalyzer.NumberFieldInfo & { name: string; levelOfMeasurements: LOM[] })
  | (DWAnalyzer.DateFieldInfo & { name: string; levelOfMeasurements: LOM[] })
  | (DWAnalyzer.StringFieldInfo & { name: string; levelOfMeasurements: LOM[] });

export type DataRow = Record<string, any>;
export type DataRows = DataRow[];

export type FieldTypes = 'null' | 'boolean' | 'integer' | 'float' | 'date' | 'string';
export type EncodingType =
  | 'quantitative'
  | 'temporal'
  | 'ordinal'
  | 'nominal'
  | 'continuous'
  | 'discrete'
  | 'interval'
  | 'const';

export * from './graph';
export * from './spec';
export * from './advice';
export * from './lint';
