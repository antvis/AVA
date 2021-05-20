import { FieldName } from 'vega-lite/build/src/channeldef';
import { Data, InlineData, UrlData } from 'vega-lite/build/src/data';
import { Encoding } from 'vega-lite/build/src/encoding';
import { TopLevelUnitSpec } from 'vega-lite/build/src/spec/unit';
import { VgData } from 'vega-lite/build/src/vega.schema';
import { RuleID } from '../fixer/rules';
import { arrayEqualIgnoreOrder, isObjectDataStructure } from '../utils';

/**
 * Customized `ValueOf` analogous to `keyof`.
 */
export type ValueOf<T> = T[keyof T];

/**
 * Rule
 * TODO: desc
 */
export interface Rule {
  id: string;
  param1: string;
  param2: string;
}
export const RULE_KEYS = ['id', 'param1', 'param2'];

export interface Scale {
  domainMin?: number;
  domianMax?: number;
}

/**
 * Field
 * TODO: desc
 */
export interface Field {
  field: string;
  fieldType: 'string' | 'number' | 'boolean' | 'datetime';
  type: 'quantitative' | 'ordinal' | 'nominal' | 'temporal';
  cardinality: number;
  min?: number;
  max?: number;
  scale?: Scale;
}

/**
 * Action
 * TODO: desc
 */
export interface Action {
  name: string;
  param1: string;
  param2: string;
  ruleID: RuleID;
  originAction?: string;
  transition?: number;
  reward?: number;
  score?: number;
  apply?: 0 | 1;
}

/**
 * A row of data record in js Object.
 */
export type DataRow = Record<string, any>;

/**
 * A dataset as an array of data records.
 */
export type Dataset = DataRow[];

export function isDataset(data: any[]): data is Dataset {
  if (data.length === 0) return true;
  if (!isObjectDataStructure(data[0])) return false;
  const columnNames = Object.keys(data[0]);
  return data.every((rec) => isObjectDataStructure(rec) && arrayEqualIgnoreOrder(Object.keys(rec), columnNames));
}

/**
 * Vega-Lite JSON in js object.
 * In this project we consider <FieldName> only.
 */
export type VegaLite = TopLevelUnitSpec<FieldName>;

export type Channel = keyof Encoding<FieldName>;

export function isUrlData(data: Partial<Data> | Partial<VgData>): data is UrlData {
  return 'url' in data;
}

export function isInlineData(data: Partial<Data> | Partial<VgData>): data is InlineData {
  return 'values' in data;
}

export const AVAILABLE_MARKS = ['area', 'bar', 'line', 'point', 'tick'] as const;
export type AvailableMark = typeof AVAILABLE_MARKS[number];
export function isAvailableMark(mark: string): mark is AvailableMark {
  return AVAILABLE_MARKS.includes(mark as any);
}

export const AVAILABLE_CHANNELS = ['x', 'y', 'size', 'color'] as const;
export type AvailableChannel = typeof AVAILABLE_CHANNELS[number];
export function isAvailableChannel(channel: string): channel is AvailableChannel {
  return AVAILABLE_CHANNELS.includes(channel as any);
}

export const AVAILABLE_P_TYPE = ['quantitative', 'ordinal', 'nominal', 'temporal'] as const;
export type AvailablePType = typeof AVAILABLE_P_TYPE[number];
export function isAvailablePType(ptype: string): ptype is AvailablePType {
  return AVAILABLE_P_TYPE.includes(ptype as any);
}

export const AVAILABLE_AGG = ['count', 'mean', 'median', 'min', 'max', 'stdev', 'sum'] as const;
export type AvailableAgg = typeof AVAILABLE_AGG[number];
export function isAvailableAgg(agg: string): agg is AvailableAgg {
  return AVAILABLE_AGG.includes(agg as any);
}
