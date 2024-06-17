import {
  BasicDataPropertyForAdvice,
  RuleModule,
  Specification,
  DesignRuleModule,
  AdvisorPipelineContext,
} from '../../../../../types';
import { deepMix } from '../../../../../utils';

export function applyDesignRules(
  chartType: string,
  dataProps: BasicDataPropertyForAdvice[],
  ruleBase: Record<string, RuleModule>,
  chartSpec: Specification,
  advisorContext?: Pick<AdvisorPipelineContext, 'extra'>
) {
  const toCheckRules = Object.values(ruleBase).filter(
    (rule: RuleModule) =>
      rule.type === 'DESIGN' && rule.trigger({ dataProps, chartType, advisorContext }) && !ruleBase[rule.id].option?.off
  );
  const encodingSpec = toCheckRules.reduce((lastSpec, rule: RuleModule) => {
    const relatedSpec = (rule as DesignRuleModule).optimizer(dataProps, chartSpec, advisorContext);
    return deepMix(lastSpec, relatedSpec);
  }, {});
  return encodingSpec;
}
