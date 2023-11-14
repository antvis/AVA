import { PCorrTestParameter } from '../data/statistics/types';

import { PATTERN_TYPES, HOMOGENEOUS_PATTERN_TYPES } from './constant';
import { AugmentedMarks } from './chart/types';

import type { G2Spec } from '@antv/g2';
import type { ParagraphSpec } from '../ntv/types';
import type { NumberFieldInfo, DateFieldInfo, StringFieldInfo, Extra } from '../data/types';

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
export interface InsightVisualizationSpec {
  patternType: InsightType;
  chartSpec: G2Spec;
  /** augmented marks */
  annotationSpec?: AugmentedMarks;
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
  visualizationSpecs?: InsightVisualizationSpec[];
}

export type Language = 'zh-CN' | 'en-US';

/**
 * config of visualization
 */
export type InsightVisualizationOptions = {
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

export type LowVarianceParameter = {
  /** Default value is 0.15  */
  cvThreshold?: number;
};

export type MajorityParameter = {
  /** Proportion greater than limit is considered as significant. Default value is 0.6 */
  limit?: number;
};

export type OutlierParameter = {
  /**
   * - IQR: Inter Quartile Range method which is used by default. A point is considered an outlier when it lies outside of iqrK times the inter quartile range.
   * - p-value: Assuming that the data follows a normal distribution, a point is considered an outlier if the two-sided test p-value is less than 1-confidenceInterval.
   * */
  method?: 'IQR' | 'p-value';
  /** Parameter of Inter Quartile Range method. Default value is 1.5. */
  iqrK?: number;
  /** Parameter of p-value method. Default value is 0.95. */
  confidenceInterval?: number;
};

export type CommonParameter = {
  /** Significance level (alpha) in hypothesis testing */
  threshold?: number;
};

/** Key parameters in the algorithm for extracting insights */
export type AlgorithmParameter = {
  /**
   * Contains both category outlier and time series outlier
   * */
  outlier?: OutlierParameter;
  /** time series trend, Default value of significance is 0.05 */
  trend?: CommonParameter;
  /** Significance level (alpha) in Bayesian online change point detection. Default value is 0.15 */
  changePoint?: CommonParameter;
  correlation?: PCorrTestParameter;
  lowVariance?: LowVarianceParameter;
  majority?: MajorityParameter;
};

export type InsightExtractorOptions = Pick<InsightOptions, 'algorithmParameter' | 'dataProcessInfo'> & {
  /** Whether to filter non-significant insights. The default is false. */
  filterInsight?: boolean;
  /** Whether data length, type, etc. need to be verified. The default is false. */
  dataValidation?: boolean;
  visualizationOptions?: InsightVisualizationOptions;
};

export type InsightExtractorProps = {
  data: Datum[];
  dimensions: Dimension[];
  measures: Measure[];
  insightType: InsightType;
  options?: InsightExtractorOptions;
};

export type PreValidationProps = Omit<InsightExtractorProps, 'algorithmParameter'>;

export type GetPatternInfo<T = PatternInfo> = (props: InsightExtractorProps) => T[] | [NoPatternInfo];

export type AlgorithmStandardInput = {
  dimension: string;
  measure: string;
  values: number[];
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
  visualization?: boolean | Partial<InsightVisualizationOptions>;
  /** on/off extra homogeneous insight extraction */
  homogeneous?: boolean;
  /** Whether to close the search for subspaces */
  ignoreSubspace?: boolean;
  /** Parameter passed through to the data frame during data pre-processing */
  dataProcessInfo?: Extra;
  /** Key parameters in the algorithm for extracting insights */
  algorithmParameter?: AlgorithmParameter;
}

export interface BasePatternInfo<T extends InsightType> {
  type: T;
  significance: number;
  /** Significant insight at the specified significance threshold */
  significantInsight?: boolean;
  info?: string;
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

export type TimeSeriesInfo = {
  baselines: number[];
  thresholds: [number, number];
};

export type CategoryOutlierInfo = BasePatternInfo<'category_outlier'> & PointPatternInfo;
export type TimeSeriesOutlierInfo = BasePatternInfo<'time_series_outlier'> & PointPatternInfo & TimeSeriesInfo;
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

export type NoPatternInfo = BasePatternInfo<InsightType> & {
  info: string;
  [key: string]: any;
};

export type InsightsResult = {
  insights: InsightInfo<PatternInfo>[];
  homogeneousInsights?: InsightInfo<HomogeneousPatternInfo>[];
};

export type SpecificInsightProps = InsightExtractorProps;

export type SpecificInsightResult = Required<Omit<InsightInfo<PatternInfo>, 'score'>>;

export type PatternInfo2InsightInfoProps = SpecificInsightProps & {
  patternInfos: PatternInfo[];
};
