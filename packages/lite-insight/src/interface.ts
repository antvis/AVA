import { PATTERN_TYPES, HOMOGENEOUS_PATTERN_TYPES } from './constant';

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

export type InsightType = typeof PATTERN_TYPES[number];

export type HomogeneousInsightType = typeof HOMOGENEOUS_PATTERN_TYPES[number];

/** insight chart type recommendation */
export type ChartType = 'column_chart' | 'line_chart' | 'pie_chart';

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
export interface InsightInfo<T> {
  subspaces: Subspace[];
  breakdowns: string[];
  measures: Measure[];
  score: number;
  data: Datum[];
  patterns: T[];

  visualizationSchemas?: VisualizationSchema[];
}

/** cutsom options */
export interface InsightOptions {
  dimensions?: string[];
  measures?: Measure[];
  impactMeasures?: ImpactMeasure[]; // Measures for Impact score
  impactWeight?: number;  // Insight score = Impact score * impactWeight + Significance * (1 - impactWeight)
  insightTypes?: InsightType[];
  limit?: number; // Limit on the number of insights
  homogeneous?: boolean; // on/off extra homogeneous insight extraction
}

export interface BasePatternInfo {
  type: InsightType;
  significance: number;
}

export interface HomogeneousPatternInfo {
  type: HomogeneousInsightType;
  significance: number;
  insightType: InsightType;
  childPatterns: PatternInfo[];
  exc?: string[];
  commSet: string[];
}

export interface PointPatternInfo extends BasePatternInfo {
  index: number;
  dimension: string;
  measure: string;
  x: string | number;
  y: number;
}

export type OutlierInfo = PointPatternInfo;

export type ChangePointInfo = PointPatternInfo;

export type MajorityInfo = PointPatternInfo & { proportion: number };


export type TrendType = 'decreasing' | 'increasing' | 'no trend';

export interface LinearRegressionResult {
  r2: number; // R-squared
  points: number[];
  equation: [m: number, c: number]; // y = mx + c
}

export interface TrendInfo extends BasePatternInfo {
  trend: TrendType;
  regression: LinearRegressionResult;
  dimension: string;
  measure: string;
}
