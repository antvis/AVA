import { RowData } from '@antv/dw-transform';
import { ChartID, Purpose } from '@antv/knowledge';

const tuple = <T extends string[]>(...args: T) => args;

/**
 * @beta
 */
export const SCAG_TYPES = tuple(
  'Clumpiness',
  'Outlyingness',
  'Skinness',
  'Stringness',
  'Skewness',
  'Striation',
  'Convexity',
  'Sparsity',
  'Monotonicity'
);

/**
 * @beta
 */
export const INSIGHT_TYPES = tuple('Perception', 'Correlation');

/**
 * @beta
 */
export type InsightType = typeof INSIGHT_TYPES[number];

/**
 * @beta
 */
export interface InsightProps {
  dimensions?: string[];
  measures?: string[];
  score?: number;
  detail?: any;
}

/**
 * @beta
 */
export interface Insight {
  type: InsightType | 'SomeInsight';
  description?: string;
  fields: string[];
  insightProps?: InsightProps;
  present?: {
    fields?: string[];
    type?: ChartID;
    encoding?: any;
    purpose?: Purpose[];
    data?: RowData[];
    configs?: any;
  };
}

/**
 * @beta
 */
export interface scagResult {
  indX?: number;
  indY?: number;
  k?: number;
  val?: number;
}

/**
 * @beta
 */
export interface scagOptions {
  binType?: string;
  startBinGridSize?: number;
  isNormalized?: boolean;
  isBinned?: boolean;
  outlyingUpperBound?: number;
  minBins?: number;
  maxBins?: number;
}

/**
 * @beta
 */
export interface scagScanner {
  outlyingScore?: number;
  skewedScore?: number;
  sparseScore?: number;
  clumpyScore?: number;
  striatedScore?: number;
  convexScore?: number;
  skinnyScore?: number;
  stringyScore?: number;
  monotonicScore?: number;
}

/**
 * @beta
 */
export interface scagFixData {
  outArr: number[][];
  fixnum: number[];
}
