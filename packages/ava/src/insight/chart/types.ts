import { Mark } from '@antv/g2';

import { Datum } from '../types';

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
  points?: [number, number][];
};

export type LineMarkConfig = {
  label?: LabelType;
  style?: Mark['style'];
  tooltip?: Mark['tooltip'];
};

export type AreaMarkData = [number, [number, number][]][];

export type AreaMarkConfig = {
  style?: Mark['style'];
  tooltip?: Mark['tooltip'];
};
