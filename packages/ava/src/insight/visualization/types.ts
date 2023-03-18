import { Mark } from '@antv/g2';

import { Datum } from '../types';

export type TextMarkConfig = {
  label?: (d: Datum) => string;
  style?: Mark['style'];
};

export type PointMarkConfig = {
  strokeColor?: string;
  fillColor?: string;
};

export type LineMarkConfig = {
  lineX?: number;
  lineY?: number;
  points?: (number | string)[];
  label?: string;
  style?: Mark['style'];
};
