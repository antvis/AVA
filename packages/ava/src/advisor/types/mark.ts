/** g2-spec 相关types */
import type { IntervalMark, RectMark, LineMark, PointMark, TextMark, CellMark, AreaMark } from '@antv/g2';
import type { Specification } from '../../common/types';

export type Mark = IntervalMark | RectMark | LineMark | PointMark | TextMark | CellMark | AreaMark;

export type Primitive = number | string | boolean | Date;

export type TabularData = Record<string, Primitive>[];

export type Callback = (datum: Record<string, Primitive>, index: number, data: TabularData) => Primitive;

export type DataType = 'quantitative' | 'categorical' | 'temporal';

/** Encode 的值 */
export type Encode = Primitive | Callback;

/** Encode 的对象 */
export type MarkEncode = Record<string, Encode>;

/** 带有字段类型的 Encode 对象 */
export type MarkEncodeWithType = Record<string, { field: Encode; type: DataType }>;

/** 原 G2 spec 去掉复杂 Encode 类型并添加简易版 Encode 类型 */
export type G2ChartSpec = Omit<Mark, 'encode'> & { encode: MarkEncode };

/** 原 G2 spec 去掉复杂 Encode 类型并添加简易版（带字段类型的） Encode 类型 */
export type ChartSpecWithEncodeType = Omit<Mark, 'encode'> & { encode: MarkEncodeWithType };

export type { Specification };
