import type { AreaMark, IntervalMark, LineMark, Mark, PointMark, TextMark } from '@antv/g2';
import type { Datum } from '../types';

type LabelType = string | ((d: Datum) => string);

export type TextMarkConfig = {
  // TODO 这里的类型最好从 G2 中获取，但是 G2 中的类型定义太宽泛，这里先使用内部定义
  label?: LabelType;
  style?: Mark['style'];
  formatter?: (value: number) => string;
};

export type PointMarkConfig = {
  style?: Mark['style'];
  tooltip?: Mark['tooltip'];
};

export type LineMarkData = {
  /** draw a vertical line at x value */
  x?: number;
  /** draw a horizontal line at y value */
  y?: number;
  /** draw a line using specific points */
  points?: { x: number; y: number }[];
};

export type LineMarkConfig = {
  encode?: Mark['encode'];
  label?: string;
  style?: Mark['style'];
  tooltip?: Mark['tooltip'];
};

export type AreaMarkData = { x: number; y: [number, number] }[];

export type AreaMarkConfig = {
  encode?: Mark['encode'];
  style?: Mark['style'];
  tooltip?: Mark['tooltip'];
};

export type IntervalMarkConfig = {
  style?: Mark['style'];
};

export type ChangePointMark = {
  changePoint: (PointMark | TextMark)[];
};

export type TrendMark = {
  trendLine: LineMark[];
};

export type TimeSeriesOutlierMark = {
  trendLine: LineMark[];
  anomalyArea: AreaMark[];
  outliers?: PointMark[];
};

export type CategoryOutlierMark = {
  categoryOutlier: (IntervalMark | TextMark)[];
};

export type LowVarianceMark = {
  meanLine: LineMark[];
};

export type AugmentedMarks =
  | ChangePointMark[]
  | TrendMark[]
  | TimeSeriesOutlierMark[]
  | CategoryOutlierMark[]
  | LowVarianceMark[];
