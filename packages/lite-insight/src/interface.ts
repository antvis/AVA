import { IPhrase } from '@antv/text-schema';
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
  dimensions: string[];
  measures: Measure[];
}

export type InsightType = typeof PATTERN_TYPES[number];

export type HomogeneousInsightType = typeof HOMOGENEOUS_PATTERN_TYPES[number];

/** insight chart type recommendation */
export type ChartType = 'column_chart' | 'line_chart' | 'pie_chart';

/** pattern information */
export type PatternInfo =
  | CategoryOutlierInfo
  | TimeSeriesOutlierInfo
  | ChangePointInfo
  | LowVarianceInfo
  | TrendInfo
  | ChangePointInfo;

/** visualization for insight */
export interface VisualizationSchema {
  chartType: ChartType;
  caption: string;
  chartSchema: any; // TODO type
  /**
   * @description insight summaries display type, it dependent
   * @default string[]
   */
  insightSummaries?: string[] | IPhrase[][];
}

/** insight information */
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
  dimensions?: string[];
  measures?: Measure[];
  impactMeasures?: ImpactMeasure[]; // Measures for Impact score
  impactWeight?: number; // Insight score = Impact score * impactWeight + Significance * (1 - impactWeight)
  insightTypes?: InsightType[];
  limit?: number; // Limit on the number of insights
  /** on / off the output of visualization scheme */
  visualization?: boolean | VisualizationOptions;
  homogeneous?: boolean; // on/off extra homogeneous insight extraction
  ignoreSubspace?: boolean; // Whether to close the search for subspaces
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
