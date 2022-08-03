import { Info, RuleModule } from '../../ruler';

import type { Specification, Lint } from '../../types';
import type { ScoringResultForRule } from '../../advisor';
import type { ChartRuleModule, DesignRuleModule } from '../../ruler/interface';

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
      const { weight, extra } = r.option || {};
      return judge(r.type) && !r.option?.off && r.trigger({ ...info, weight, ...extra });
    })
    .forEach((r: RuleModule) => {
      const { type, id, docs } = r;
      let score: number;
      if (ruleTypeToLint === 'DESIGN') {
        const fix = (r as DesignRuleModule).optimizer(info.dataProps, spec);
        // no fix -> means no violation
        const score = Object.keys(fix).length === 0 ? 1 : 0;
        lints.push({ type, id, score, fix, docs });
      } else {
        const { weight, extra } = r.option || {};
        // no weight for linter's result
        const score = (r as ChartRuleModule).validator({ ...info, weight, ...extra }) as number;
        lints.push({ type, id, score, docs });
      }
      log.push({ phase: 'LINT', ruleId: r.id, score, base: score, weight: 1, ruleType: r.type });
    });
};
export default lintRules;
