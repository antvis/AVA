import { Info, RuleModule } from '../../ruler';
import { isCustomTrigger, isCustomValidator, isDesignRuleModule } from '../../ruler/utils';

import type { Specification, Lint } from '../../types';
import type { ScoringResultForRule } from '../../advisor';

const lintRules = (
  ruleBase: Record<string, RuleModule>,
  ruleTypeToLint: 'notDESIGN' | 'DESIGN',
  info: Info,
  log: ScoringResultForRule[],
  lints: Lint[],
  spec?: Specification
) => {
  const judge = (type: 'HARD' | 'SOFT' | 'DESIGN') => {
    if (ruleTypeToLint === 'DESIGN') {
      return type === 'DESIGN';
    }
    return type !== 'DESIGN';
  };

  Object.values(ruleBase)
    .filter((r: RuleModule) => {
      const { weight } = r.option || {};
      if (isCustomTrigger(r.trigger)) {
        const { customArgs } = r.trigger;
        return judge(r.type) && !r.option?.off && r.trigger.func({ ...info, weight, ...customArgs });
      }
      return judge(r.type) && !r.option?.off && r.trigger({ ...info, weight });
    })
    .forEach((r: RuleModule) => {
      const { type, id, docs } = r;
      let score: number;
      if (isDesignRuleModule(r)) {
        const fix = r.optimizer(info.dataProps, spec);
        // no fix -> means no violation
        const score = Object.keys(fix).length === 0 ? 1 : 0;
        lints.push({ type, id, score, fix, docs });
      } else {
        const { weight } = r.option || {};
        // no weight for linter's result
        let score: number;
        if (isCustomValidator(r.validator)) {
          const { customArgs } = r.validator;
          r.validator.func({
            ...info,
            weight,
            ...customArgs,
          });
        } else {
          score = r.validator({ ...info, weight }) as number;
        }
        lints.push({ type, id, score, docs });
      }
      log.push({ phase: 'LINT', ruleId: id, score, base: score, weight: 1, ruleType: type });
    });
};
export default lintRules;
