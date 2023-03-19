import { Info, RuleModule } from '../ruler';
import { DEFAULT_RULE_WEIGHTS } from '../constants';
import { CHART_IDS } from '../../ckb';

import type { ScoringResultForRule } from '../types';
import type { ChartRuleModule } from '../ruler/types';
import type { CkbTypes } from '../../ckb';

const defaultWeights = DEFAULT_RULE_WEIGHTS;
declare type ChartID = typeof CHART_IDS[number];

const computeScore = (
  chartType: ChartID | string,
  chartWIKI: CkbTypes.ChartKnowledgeBase,
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

export default computeScore;
