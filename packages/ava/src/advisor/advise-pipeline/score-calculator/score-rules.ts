import {
  BasicDataPropertyForAdvice,
  RuleModule,
  AdvisorOptions,
  ScoringResultForChartType,
  ScoringResultForRule,
} from '../../types';

import { computeScore } from './compute-score';

import type { ChartId, ChartKnowledgeBase } from '../../../ckb';

/**
 * Run all rules for a given chart type, get scoring result.
 *
 * @param chartType chart ID to be score
 * @param dataProps data props of the input data
 * @param ruleBase rule base
 * @param options
 * @returns
 */
export function scoreRules(
  chartType: ChartId | string,
  chartWIKI: ChartKnowledgeBase,
  dataProps: BasicDataPropertyForAdvice[],
  ruleBase: Record<string, RuleModule>,
  options?: AdvisorOptions
): ScoringResultForChartType {
  const purpose = options ? options.purpose : '';
  const preferences = options ? options.preferences : undefined;

  // for log
  const log: ScoringResultForRule[] = [];

  const info = { dataProps, chartType, purpose, preferences };

  const hardScore = computeScore(chartType, chartWIKI, ruleBase, 'HARD', info, log);

  // Hard-Rule pruning
  if (hardScore === 0) {
    const result: ScoringResultForChartType = { chartType, score: 0, log };
    return result;
  }

  const softScore = computeScore(chartType, chartWIKI, ruleBase, 'SOFT', info, log);

  const score = hardScore * softScore;

  const result: ScoringResultForChartType = { chartType, score, log };

  return result;
}
