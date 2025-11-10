import { CHARTS } from '../ckb';

/**
 * @desc compute allowed chart ids based on includes and excludes
 */
export function computeAllowedChartIds(includes?: string[], excludes?: string[]): string[] {
  const all = Object.keys(CHARTS);
  const inc = includes && includes.length ? all.filter((id) => includes.includes(id)) : all;
  const excSet = new Set(excludes || []);
  return inc.filter((id) => !excSet.has(id));
}
