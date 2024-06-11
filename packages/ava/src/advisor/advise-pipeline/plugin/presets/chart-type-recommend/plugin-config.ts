import { getChartTypeRecommendations } from './get-chart-Type';

import type {
  AdvisorPipelineContext,
  ChartTypeRecommendInput,
  ChartTypeRecommendOutput,
  AdvisorPluginType,
} from '../../../../types';

export const chartTypeRecommendPlugin: AdvisorPluginType<ChartTypeRecommendInput, ChartTypeRecommendOutput> = {
  name: 'defaultChartTypeRecommend',
  stage: ['chartTypeRecommend'],
  execute(input: ChartTypeRecommendInput, context?: AdvisorPipelineContext): ChartTypeRecommendOutput {
    const { dataProps } = input;
    const { advisor, options } = context || {};
    const chartTypeRecommendations = getChartTypeRecommendations({
      dataProps,
      chartWIKI: advisor.ckb,
      ruleBase: advisor.ruleBase,
      options,
    });
    return { chartTypeRecommendations };
  },
};
