import { PATTERN_TYPES, HOMOGENEOUS_PATTERN_TYPES } from './constant';

import type { G2Spec } from '@antv/g2';
import type { NtvTypes } from '../ntv';
import type { DataTypes } from '../data';

export type Datum = Record<string, string | number>;

export type DataType = 'Nominal' | 'Ordinal' | 'Interval' | 'Discrete' | 'Continuous' | 'Time';

export type FieldType = 'measure' | 'dimension';

export type MeasureMethod = 'SUM' | 'COUNT' | 'MAX' | 'MIN' | 'MEAN' | 'COUNT_DISTINCT';

// impact measures must satisfies anti-monotonic condition and is bounded between 0 and 1.
export type ImpactMeasureMethod = 'SUM' | 'COUNT';

export type Aggregator = (data: Datum[], measure: string) => number;

export type DataProperty =
  | (DataTypes.NumberFieldInfo & { name: string; fieldType: FieldType })
  | (DataTypes.DateFieldInfo & { name: string; fieldType: FieldType })
  | (DataTypes.StringFieldInfo & { name: string; fieldType: FieldType });

export type Measure = {
  /** field id, currently, field id is the same as the field name */
  field: string;
  method: MeasureMethod;
};

export type Dimension = {
  /** field id, currently, field id is the same as the field name */
  field: string;
};

export type Subspace = {
  dimension: string;
  // TODO @chenluli may need a more general type to describe filter, such as string[] | number[] and add operator property to Subspace. If there is a real case then expand it
  value: string;
}[];

export type ImpactMeasure = {
  field: string;
  method: ImpactMeasureMethod;
};

/**
 * insight data subject information
 */
export interface SubjectInfo {
  subspace: Subspace;
  dimensions: string[];
  measures: Measure[];
}

export type InsightType = (typeof PATTERN_TYPES)[number];

export type HomogeneousInsightType = (typeof HOMOGENEOUS_PATTERN_TYPES)[number];

/** insight chart type recommendation */
export type ChartType = 'column_chart' | 'line_chart' | 'pie_chart' | 'scatter_plot';

/** pattern information */
export type PatternInfo =
  | CategoryOutlierInfo
  | TimeSeriesOutlierInfo
  | ChangePointInfo
  | LowVarianceInfo
  | TrendInfo
  | ChangePointInfo
  | CorrelationInfo;

/** explanation and visualization for insight */
export interface VisualizationSchema {
  chartType: ChartType;
  chartSchema: G2Spec;
  /**
   * @description pure text or text schema to describe insight
   * @default string
   */
  insightSummaries?: string[] | NtvTypes.NarrativeTextSpec[];
}

/** output insight information */
export interface InsightInfo<T = PatternInfo> {
  subspace: Subspace;
  dimensions: string[];
  measures: Measure[];
  score: number;
  data: Datum[];
  patterns: T[];
  visualizationSchemas?: VisualizationSchema[];
}

/**
 * config of visualization
 */
export interface VisualizationOptions {
  /**
   * @description pure text or text schema to description insight summary
   * @default 'text'
   * */
  summaryType: 'text' | 'schema' | false;
}

/** custom options */
export interface InsightOptions {
  /** dimensions (field names) for analysis */
  dimensions?: string[];
  /** measures for analysis */
  measures?: Measure[];
  /** Measures for Impact score */
  impactMeasures?: ImpactMeasure[];
  /** Insight score = Impact score * impactWeight + Significance * (1 - impactWeight) */
  impactWeight?: number;
  /** types of insight */
  insightTypes?: InsightType[];
  /** Limit on the number of insights */
  limit?: number;
  /** on / off the output of visualization scheme */
  visualization?: boolean | VisualizationOptions;
  /** on/off extra homogeneous insight extraction */
  homogeneous?: boolean;
  /** Whether to close the search for subspaces */
  ignoreSubspace?: boolean;
}

export interface BasePatternInfo<T extends InsightType> {
  type: T;
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

export type PointPatternInfo = {
  index: number;
  dimension: string;
  measure: string;
  x: string | number;
  y: number;
};

export type CategoryOutlierInfo = BasePatternInfo<'category_outlier'> & PointPatternInfo;
export type TimeSeriesOutlierInfo = BasePatternInfo<'time_series_outlier'> & PointPatternInfo;
export type ChangePointInfo = BasePatternInfo<'change_point'> & PointPatternInfo;
export type MajorityInfo = BasePatternInfo<'majority'> & PointPatternInfo & { proportion: number };

export type TrendType = 'decreasing' | 'increasing' | 'no trend';

export interface LinearRegressionResult {
  r2: number; // R-squared
  points: number[];
  equation: [m: number, c: number]; // y = mx + c
}

export type TrendInfo = BasePatternInfo<'trend'> & {
  trend: TrendType;
  regression: LinearRegressionResult;
  dimension: string;
  measure: string;
};

export type LowVarianceInfo = BasePatternInfo<'low_variance'> & { dimension: string; measure: string; mean: number };

export type CorrelationInfo = BasePatternInfo<'correlation'> & {
  pcorr: number;
  measures: [string, string];
};

export type InsightsResult = {
  insights: InsightInfo<PatternInfo>[];
  homogeneousInsights?: InsightInfo<HomogeneousPatternInfo>[];
};
