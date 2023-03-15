import { ScaleTypes, Mark } from '@antv/g2';
import { mapValues } from 'lodash';

type Primitive = number | string | boolean | Date;

type TabularData = Record<string, Primitive>[];

type Callback = (datum: Record<string, Primitive>, index: number, data: TabularData) => Primitive;

type DataType = 'quantitative' | 'categorical' | 'temporal';

/** Encode 的值 */
type Encode = Primitive | Callback;

/** Encode 的对象 */
type MarkEncode = Record<string, Encode>;

/** 带有字段类型的 Encode 对象 */
type MarkEncodeWithType = Record<string, { field: Encode; type: DataType }>;

/** 原 G2 spec 去掉复杂 Encode 类型并添加简易版 Encode 类型 */
export type G2ChartSpec = Omit<Mark, 'encode'> & { encode: MarkEncode };

/** 原 G2 spec 去掉复杂 Encode 类型并添加简易版（带字段类型的） Encode 类型 */
export type ChartSpecWithEncodeType = Omit<Mark, 'encode'> & { encode: MarkEncodeWithType };

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

// @ts-ignore: constant - 常数比例尺 / identity - 恒等比例尺 对用户不透出，所以此处ts-ignore
function scaleType2dataType(scaleType: ScaleTypes): DataType {
  switch (scaleType) {
    case 'linear':
    case 'log':
    case 'pow':
    case 'sqrt':
    case 'qunatile':
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
    return { field: value, type: inferDataType(data, value, scale[key].type) };
  });
  return { ...chartSpec, encode: newEncode };
}
