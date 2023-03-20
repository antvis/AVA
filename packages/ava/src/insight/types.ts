import { PATTERN_TYPES, HOMOGENEOUS_PATTERN_TYPES } from './constant';

import type { G2Spec } from '@antv/g2';
import type { ParagraphSpec } from '../ntv/types';
import type { NumberFieldInfo, DateFieldInfo, StringFieldInfo } from '../data/types';

export type Datum = Record<string, string | number>;

// Multiple exports of name 'DataType'
// export type DataType = 'Nominal' | 'Ordinal' | 'Interval' | 'Discrete' | 'Continuous' | 'Time';

export type DomainType = 'measure' | 'dimension';

export type MeasureMethod = 'SUM' | 'COUNT' | 'MAX' | 'MIN' | 'MEAN' | 'COUNT_DISTINCT';

// impact measures must satisfies anti-monotonic condition and is bounded between 0 and 1.
export type ImpactMeasureMethod = 'SUM' | 'COUNT';

export type Aggregator = (data: Datum[], measure: string) => number;

/** output of data module, plus the field name and its domain type  */
export type DataProperty = (NumberFieldInfo | DateFieldInfo | StringFieldInfo) & {
  /** field name */
  name: string;
  /** whether this field is used as a dimension or measure */
  domainType: DomainType;
};

export type Measure = {
  /** use the field name as uniq key */
  fieldName: string;
  method: MeasureMethod;
};

export type Dimension = {
  /** use the field name as uniq key */
  fieldName: string;
};

export type Subspace = {
  dimension: string;
  // TODO @chenluli may need a more general type to describe filter, such as string[] | number[] and add operator property to Subspace. If there is a real case then expand it
  value: string;
}[];

export type ImpactMeasure = {
  fieldName: string;
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
  | LowVarianceInfo
  | TrendInfo
  | ChangePointInfo
  | CorrelationInfo
  | MajorityInfo;

/** explanation and visualization for insight */
export interface VisualizationSpec {
  patternType: InsightType;
  chartSpec: G2Spec;
  /**
   * @description explain insight by text
   * @default ParagraphSpec[]
   */
  narrativeSpec?: ParagraphSpec[];
}

/** output insight information */
export interface InsightInfo<T = PatternInfo> {
  subspace: Subspace;
  dimensions: Dimension[];
  measures: Measure[];
  score?: number;
  data: Datum[];
  patterns: T[];
  visualizationSpecs?: VisualizationSpec[];
}

export type Language = 'zh-CN' | 'en-US';

/**
 * config of visualization
 */
export type VisualizationOptions = {
  /**
   * @description pure text or text specification to description insight summary
   * @default 'text'
   * */
  // TODO @yuxi support text
  // narrativeType: 'text' | 'spec' | false;
  /**
   * @description explain insight use which language
   * @default 'en-US'
   * @experimental Using natural language to describe insights is an experimental feature and the output may be subject to change.
   */
  lang: Language;
};

/** custom options */
export interface InsightOptions {
  /** dimensions for analysis */
  dimensions?: Dimension[];
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
  visualization?: boolean | Partial<VisualizationOptions>;
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
  /** dimension values that share same patterns */
  commonSet: string[];
  /** dimension values that do not share same patterns with others */
  exceptions?: string[];
}

export type PointPatternInfo = {
  index: number;
  dimension: string;
  measure: string;
  x: string | number;
  y: number;
};

export type CategoryOutlierInfo = BasePatternInfo<'category_outlier'> & PointPatternInfo;
export type TimeSeriesOutlierInfo = BasePatternInfo<'time_series_outlier'> &
  PointPatternInfo & {
    baselines: number[];
    thresholds: [number, number];
  };
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
