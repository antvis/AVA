import { getChartTypeRecommendations } from './get-chart-Type';

import type {
  AdvisorPipelineContext,
  ChartTypeRecommendInputParams,
  ChartTypeRecommendOutput,
  PluginType,
} from '../../../../types';

export const chartTypeRecommendPlugin: PluginType<ChartTypeRecommendInputParams, ChartTypeRecommendOutput> = {
  name: 'defaultChartTypeRecommend',
  stage: ['chartTypeRecommend'],
  execute(input: ChartTypeRecommendInputParams, context?: AdvisorPipelineContext): ChartTypeRecommendOutput {
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
