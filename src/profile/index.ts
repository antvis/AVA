// TODO(profile, on demand): Add a separate formatter when a consumer needs prompt/text output from Profile.
// TODO(profile, on demand): Add opt-in LLM semantic enrichment outside the statistics path, with timeout/failure handling.
// TODO(profile, on demand): Build quality checks as a separate consumer of metric results, not part of profile computation.
// These are future directions, not placeholder APIs or required parts of v1.
export { parseProfileOptions } from './options';
export { registerMetrics, hasMetric } from './registry';

export type {
  ProfileOptions,
  Profile,
  TableProfile,
  FieldProfile,
  MetricFrequency,
  Metric,
  MetricId,
  MetricConfig,
  ParsedProfileOptions,
  LogicalType,
} from './types';
