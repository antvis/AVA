import { INSIGHT_TYPES } from './constant';

export type Datum = Record<string, string | number>;

export type DataType = 'Nominal' | 'Ordinal' | 'Interval' | 'Discrete' | 'Continuous' | 'Time';

export type FieldType = 'measure' | 'dimension';

export type MeasureMethod = 'SUM' | 'COUNT' | 'MAX' | 'MIN' | 'MEAN';

// impact measures must satisfies anti-monotonic condition and is bounded between 0 and 1.
export type ImpactMeasureMethod = 'SUM' | 'COUNT';

export type Aggregator = (data: Datum[], measure: string) => number;

export type Subspace = {
  dimension: string;
  value: string;
}[];

export type Measure = {
  field: string;
  method: MeasureMethod;
};

export type ImpactMeasure = {
  field: string;
  method: ImpactMeasureMethod;
};

/**
 * insight data subject information
 */
export interface SubjectInfo {
  subspace: Subspace;
  breakdown: string;
  measures: Measure[];
}

export type InsightType = typeof INSIGHT_TYPES[number];

/** insight chart type recommendation */
export type ChartType = 'column_chart' | 'line_chart';

/** pattern information */
export type PatternInfo = OutlierInfo | TrendInfo | ChangePointInfo;

/** visualization for insight */
export interface VisualizationSchema {
  chartType: ChartType;
  caption: string;
  insightSummary: string[];
  chartSchema: any; // TODO type
}

/** insight information */
export interface InsightInfo {
  subspaces: Subspace[];
  breakdowns: string[];
  measures: Measure[];
  score: number;
  data: Datum[];
  patterns: PatternInfo[];

  visualizationSchemas?: VisualizationSchema[];
}

/** cutsom options */
export interface InsightOptions {
  dimensions?: string[];
  measures?: Measure[];
  impactMeasures?: ImpactMeasure[];
  insightTypes?: InsightType[];
  limit?: number;
}

export interface BasePatternInfo {
  type: InsightType;
  significance: number;
}

export interface PointPatternInfo extends BasePatternInfo {
  index: number;
  value: number;
}

export type OutlierInfo = PointPatternInfo;

export type ChangePointInfo = PointPatternInfo;

export type TrendType = 'decreasing' | 'increasing' | 'no trend';

export interface LinearRegressionResult {
  r2: number; // R-squared
  points: number[];
  equation: [number, number]; // y = mx + c
}

export interface TrendInfo extends BasePatternInfo {
  trend: TrendType;
  regression: LinearRegressionResult;
}
