import { ScaleTypes } from '@antv/g2';
import { mapValues } from 'lodash';

import type {
  Callback,
  ChartSpecWithEncodeType,
  DataType,
  Encode,
  G2ChartSpec,
  Primitive,
  TabularData,
} from '../types';

function isQuantitative(d: any): boolean {
  return typeof d === 'number';
}

function isCategorical(d: any): boolean {
  return typeof d === 'string' || typeof d === 'boolean';
}

function isTemporal(d: any): boolean {
  return d instanceof Date;
}

function isField(data: TabularData, encode: Encode): encode is string {
  return typeof encode === 'string' && data.some((d) => d[encode] !== undefined);
}

function isTransform(encode: Encode): encode is Callback {
  return typeof encode === 'function';
}

function scaleType2dataType(scaleType: ScaleTypes): DataType {
  switch (scaleType) {
    case 'linear':
    case 'log':
    case 'pow':
    case 'sqrt':
    case 'quantile':
    case 'threshold':
    case 'quantize':
    case 'sequential':
      return 'quantitative';
    case 'time':
      return 'temporal';
    case 'ordinal':
    case 'point':
    case 'band':
      return 'categorical';
    default:
      throw new Error(`Unkonwn scale type: ${scaleType}.`);
  }
}

function values2dataType(values: Primitive[]): DataType {
  if (values.some(isQuantitative)) return 'quantitative';
  if (values.some(isCategorical)) return 'categorical';
  if (values.some(isTemporal)) return 'temporal';
  throw new Error(`Unknown type: ${typeof values[0]}`);
}

function columnOf(data: TabularData, encode: Encode): Primitive[] {
  if (isTransform(encode)) return data.map(encode);
  if (isField(data, encode)) return data.map((d) => d[encode]);
  return data.map(() => encode);
}

/** 推断数据类型 */
export function inferDataType(data: TabularData, encode: Encode, scale: ScaleTypes | undefined): DataType {
  if (scale !== undefined) return scaleType2dataType(scale);
  const values = columnOf(data, encode);
  return values2dataType(values);
}

/** 获取带有字段类型的 chartSpec */
export function getSpecWithEncodeType(chartSpec: G2ChartSpec): ChartSpecWithEncodeType {
  const { encode, data, scale } = chartSpec;
  const newEncode = mapValues(encode, (value, key) => {
    return { field: value, type: inferDataType(data, value, scale?.[key].type) };
  });
  return { ...chartSpec, encode: newEncode };
}
