export const DEFAULT_RULE_WEIGHTS: Record<string, number> = {
  'bar-series-qty': 0.5,
  'data-check': 1.0,
  'data-field-qty': 1.0,
  'diff-pie-sector': 0.5,
  'landscape-or-portrait': 0.3,
  'limit-series': 1.0,
  'line-field-time-ordinal': 1.0,
  'no-redundant-field': 1.0,
  'nominal-enum-combinatorial': 1.0,
  'purpose-check': 1.0,
  'series-qty-limit': 0.8,
};

/** 内置默认模块名 */
export enum PresetComponentName {
  dataAnalyzer,
  chartTypeRecommender,
  chartEncoder,
  specGenerator,
}
