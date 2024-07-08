import { deepMix } from '../../../../utils';
import { DEFAULT_COLOR } from '../../../constants';

import { applyDesignRules, applySmartColor, applyTheme } from './spec-processors';
import { getChartTypeSpec } from './get-chart-spec';

import type {
  AdvisorPipelineContext,
  SpecGeneratorInput,
  SpecGeneratorOutput,
  AdvisorPluginType,
} from '../../../../types';

// todo 内置的 visualEncode 和 spec generate 插件需要明确支持哪些图表类型
export const specGeneratorPlugin: AdvisorPluginType<SpecGeneratorInput, SpecGeneratorOutput> = {
  name: 'defaultSpecGenerator',
  execute: (input: SpecGeneratorInput, context: AdvisorPipelineContext): SpecGeneratorOutput => {
    const { chartTypeRecommendations, dataProps, data } = input;
    const { options, advisor } = context || {};
    const { refine = false, theme, colorOptions, smartColor } = options || {};
    const { themeColor = DEFAULT_COLOR, colorSchemeType, simulationType } = colorOptions || {};
    const advices = chartTypeRecommendations
      ?.map((chartTypeAdvice) => {
        const { chartType } = chartTypeAdvice;
        const chartKnowledge = advisor.ckb[chartType];
        const chartTypeSpec =
          chartKnowledge?.toSpec?.(data, dataProps) ??
          getChartTypeSpec({
            chartType,
            data,
            dataProps,
            chartKnowledge,
          });

        // step 3: apply spec processors such as design rules, theme, color, to improve spec
        if (chartTypeSpec && refine) {
          const partEncSpec = applyDesignRules(chartType, dataProps, advisor.ruleBase, chartTypeSpec, context);
          deepMix(chartTypeSpec, partEncSpec);
        }

        // step 4: custom theme
        if (chartTypeSpec) {
          if (theme && !smartColor) {
            const partEncSpec = applyTheme(dataProps, chartTypeSpec, theme);
            deepMix(chartTypeSpec, partEncSpec);
          } else if (smartColor) {
            const partEncSpec = applySmartColor(dataProps, chartTypeSpec, themeColor, colorSchemeType, simulationType);
            deepMix(chartTypeSpec, partEncSpec);
          }
        }
        return {
          type: chartTypeAdvice.chartType,
          spec: chartTypeSpec,
          score: chartTypeAdvice.score,
        };
      })
      .filter((advices) => advices.spec);
    return { advices };
  },
};
