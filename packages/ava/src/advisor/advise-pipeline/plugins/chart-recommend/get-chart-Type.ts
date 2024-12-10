import { compareAdvices, scoreRules } from '@advisor/advise-pipeline/score-calculator';

import type { ChartKnowledge } from '@ava/ckb';
import type {
  ScoringResultForChartType,
  BasicDataPropertyForAdvice,
  RuleModule,
  AdvisorOptions,
  AdvisorPipelineContext,
} from '@advisor/types';

export const getChartTypeRecommendations = ({
  chartWIKI,
  dataProps,
  ruleBase,
  options,
  advisorContext,
}: {
  dataProps: BasicDataPropertyForAdvice[];
  chartWIKI: Record<string, ChartKnowledge>;
  ruleBase: Record<string, RuleModule>;
  options?: AdvisorOptions;
  advisorContext?: Pick<AdvisorPipelineContext, 'extra'>;
}) => {
  const chatTypes = Object.keys(chartWIKI);
  const list: ScoringResultForChartType[] = chatTypes.map((chartType) => {
    return scoreRules(chartType, chartWIKI, dataProps, ruleBase, options, advisorContext);
  });

  // filter and sorter
  return list.filter((advice) => advice.score > 0).sort(compareAdvices);
};
