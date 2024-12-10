import { Info, RuleModule } from '@advisor/ruler';

import type { Specification } from '@ava/common/types';
import type { ScoringResultForRule, Lint, AdvisorPipelineContext } from '@advisor/types';
import type { ChartRuleModule, DesignRuleModule } from '@advisor/ruler';
import type { ChartKnowledgeBase } from '@ava/ckb';

export function lintRules(
  ruleBase: Record<string, RuleModule>,
  ruleTypeToLint: 'notDESIGN' | 'DESIGN',
  info: Info,
  log: ScoringResultForRule[],
  lints: Lint[],
  ckb: ChartKnowledgeBase,
  spec?: Specification,
  advisorContext?: Pick<AdvisorPipelineContext, 'extra'>
) {
  const judge = (type: 'HARD' | 'SOFT' | 'DESIGN') => {
    if (ruleTypeToLint === 'DESIGN') {
      return type === 'DESIGN';
    }
    return type !== 'DESIGN';
  };

  Object.values(ruleBase)
    .filter((r: RuleModule) => {
      const { weight, extra } = r.option || {};
      return (
        judge(r.type) && !r.option?.off && r.trigger({ ...info, weight, ...extra, chartWIKI: ckb, advisorContext })
      );
    })
    .forEach((r: RuleModule) => {
      const { type, id, docs } = r;
      let score: number;
      if (ruleTypeToLint === 'DESIGN') {
        const fix = (r as DesignRuleModule).optimizer(info.dataProps, spec, advisorContext);
        // no fix -> means no violation
        score = Object.keys(fix).length === 0 ? 1 : 0;
        lints.push({ type, id, score, fix, docs });
      } else {
        const { weight, extra } = r.option || {};
        // no weight for linter's result
        score = (r as ChartRuleModule).validator({
          ...info,
          weight,
          ...extra,
          chartWIKI: ckb,
          advisorContext,
        }) as number;
        lints.push({ type, id, score, docs });
      }
      log.push({ phase: 'LINT', ruleId: id, score, base: score, weight: 1, ruleType: type });
    });
}
