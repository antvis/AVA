import { CHART_IDS, ChartKnowledgeBase } from '../../../ckb';
import { DEFAULT_RULE_WEIGHTS } from '../../constants';
import {
  BasicDataPropertyForAdvice,
  RuleModule,
  AdvisorOptions,
  ScoringResultForChartType,
  ScoringResultForRule,
  ChartRuleModule,
  Info,
} from '../../types';

const defaultWeights = DEFAULT_RULE_WEIGHTS;
declare type ChartID = (typeof CHART_IDS)[number];

const computeScore = (
  chartType: ChartID | string,
  chartWIKI: ChartKnowledgeBase,
  ruleBase: Record<string, RuleModule>,
  ruleType: 'HARD' | 'SOFT',
  info: Info,
  log: ScoringResultForRule[]
) => {
  // initial score is 1 for HARD rules and 0 for SOFT rules
  let computedScore = 1;
  Object.values(ruleBase)
    .filter((r: RuleModule) => {
      const weight = r.option?.weight || defaultWeights[r.id] || 1;
      const extra = r.option?.extra;
      return r.type === ruleType && r.trigger({ ...info, weight, ...extra, chartType, chartWIKI }) && !r.option?.off;
    })
    .forEach((r: RuleModule) => {
      const weight = r.option?.weight || defaultWeights[r.id] || 1;
      const extra = r.option?.extra;
      const base = (r as ChartRuleModule).validator({ ...info, weight, ...extra, chartType, chartWIKI }) as number;
      const score = weight * base;
      computedScore *= score;
      log.push({ phase: 'ADVISE', ruleId: r.id, score, base, weight, ruleType });
    });
  return computedScore;
};

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
  chartType: ChartID | string,
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
