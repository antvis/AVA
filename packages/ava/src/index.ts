/* advisor */
export { Advisor, bindRenderer } from './advisor';

/* CKB */
export {
  ckb,
  ckbDict,
  CHANNELS,
  CHART_IDS,
  COORDINATE_SYSTEMS,
  FAMILIES,
  GRAPHIC_CATEGORIES,
  LEVEL_OF_MEASUREMENTS,
  PURPOSES,
  RECOMMEND_RATINGS,
  SHAPES,
} from './ckb';

/* data */
export {
  min,
  max,
  sum,
  mean,
  normalDistributionQuantile,
  tDistributionQuantile,
  distinct,
  valueMap,
  missing,
  valid,
  pearson,
  covariance,
  coefficientOfVariance,
  standardDeviation,
  variance,
  quantile,
  quartile,
  median,
  harmonicMean,
  geometricMean,
  pcorrtest,
  cdf,
  maxabs,
} from './utils/statistics';

export * from './data';

export { CHART_NAME, CHART_PURPOSE, DEFAULT_UI_CONFIG, ENCODE_TO_GPT_VIS_ENCODE } from './constants';

/* insight */
// export { getInsights, generateInsightVisualizationSpec, insightPatternsExtractor, getSpecificInsight } from './insight';

export type {
  ChartId,
  Family,
  Purpose,
  CoordinateSystem,
  GraphicCategory,
  Shape,
  LevelOfMeasurement,
  DataPrerequisite,
  Channel,
  RecommendRating,
  PureChartKnowledge,
  ChartKnowledgeBase,
  CkbConfig,
} from './ckb';

export type { AdviseChart, Data, Meta, DataTypeMap, RenderParams } from './types';
