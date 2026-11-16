/**
 * Visualization module for chart recommendation and GPT-Vis code generation
 */

import type { ChartSpec, ChartConfig } from '../types';

export { adviseChartType } from './advisor';
export { generateVisualizationConfig, wrapConfigInHTML } from './generator';

/** Return the JSON chart config when the result contains one. */
export function getChartConfig(
  spec: Pick<ChartSpec, 'config'> | null | undefined
): Exclude<ChartConfig, string> | undefined {
  const config = spec?.config;
  return typeof config === 'string' ? undefined : config;
}
