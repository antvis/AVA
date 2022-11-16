import { createMetricName } from './createMetricName';
import { createMetricValue } from './createMetricValue';
import { createDeltaValue, createRatioValue } from './createCompare';
import { createOtherMetricValue } from './createOtherMetricValue';
import { createContributeRatio } from './createContributeRatio';
import { createDimensionValue } from './createDimensionValue';
import { createProportion } from './createProportion';
import { createTimeDesc } from './createTimeDesc';
import { createTrendDesc } from './createTrendDesc';

export const presetPlugins = [
  createMetricName(),
  createMetricValue(),
  createDeltaValue(),
  createRatioValue(),
  createOtherMetricValue(),
  createContributeRatio(),
  createDimensionValue(),
  createProportion(),
  createTimeDesc(),
  createTrendDesc(),
];

export { createMetricName } from './createMetricName';
export { createMetricValue } from './createMetricValue';
export { createDeltaValue, createRatioValue } from './createCompare';
export { createOtherMetricValue } from './createOtherMetricValue';
export { createContributeRatio } from './createContributeRatio';
export { createDimensionValue } from './createDimensionValue';
export { createProportion } from './createProportion';
export { createTimeDesc } from './createTimeDesc';
export { createTrendDesc } from './createTrendDesc';
