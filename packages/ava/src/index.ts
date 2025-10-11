/* advisor */
export { Advisor } from './advisor';

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

/* insight */
export type { Datum } from './types';
export { getInsights, generateInsightVisualizationSpec, insightPatternsExtractor, getSpecificInsight } from './insight';
