import { Info, RuleModule } from '../../ruler';
import { isCustomTrigger, isCustomValidator } from '../../ruler/utils';
import { DEFAULT_RULE_WEIGHTS } from '../../constants';

import type { ScoringResultForRule } from '../advice-pipeline/interface';
import type { ChartRuleModule } from '../../ruler/interface';

const defaultWeights = DEFAULT_RULE_WEIGHTS;

const computeScore = (
  ruleBase: Record<string, RuleModule>,
  ruleType: 'HARD' | 'SOFT',
  info: Info,
  log: ScoringResultForRule[]
) => {
  // initial score is 1 for HARD rules and 0 for SOFT rules
  let computedScore = ruleType === 'HARD' ? 1 : 0;
  Object.values(ruleBase)
    .filter((r: ChartRuleModule) => {
      const weight = r.option?.weight || defaultWeights[r.id] || 1;
      if (isCustomTrigger(r.trigger)) {
        const { customArgs } = r.trigger;
        return r.type === ruleType && r.trigger.func({ ...info, weight, ...customArgs }) && !r.option?.off;
      }
      return r.type === ruleType && r.trigger({ ...info, weight }) && !r.option?.off;
    })
    .forEach((r: ChartRuleModule) => {
      const weight = r.option?.weight || defaultWeights[r.id] || 1;
      let base: number;
      if (isCustomValidator(r.validator)) {
        const { customArgs } = r.validator;
        base = r.validator.func({
          ...info,
          weight,
          ...customArgs,
        }) as number;
      } else {
        base = r.validator({
          ...info,
          weight,
        }) as number;
      }
      const score = weight * base;
      // scores are multiplied for HARD rules and added for SOFT rules
      if (ruleType === 'HARD') {
        computedScore *= score;
      } else {
        computedScore += score;
      }
      log.push({ phase: 'ADVISE', ruleId: r.id, score, base, weight, ruleType });
    });
  return computedScore;
};

export default computeScore;
