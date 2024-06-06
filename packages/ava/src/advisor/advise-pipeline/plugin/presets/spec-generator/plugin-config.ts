import { deepMix } from '../../../../utils';
import { DEFAULT_COLOR } from '../../../constants';

import { applyDesignRules, applySmartColor, applyTheme } from './spec-processors';
import { getChartTypeSpec } from './get-chart-spec';

import type { AdvisorPipelineContext, SpecGeneratorInput, SpecGeneratorOutput, PluginType } from '../../../../types';

export const specGeneratorPlugin: PluginType<SpecGeneratorInput, SpecGeneratorOutput> = {
  name: 'defaultSpecGenerator',
  stage: ['specGenerate'],
  // todo 目前上一步输出是一个图表列表数组，这里原子能力实际上应该是只生成 spec
  execute: (input: SpecGeneratorInput, context: AdvisorPipelineContext): SpecGeneratorOutput => {
    const { chartTypeRecommendations, dataProps, data } = input;
    const { options, advisor } = context || {};
    const { refine = false, theme, colorOptions, smartColor } = options || {};
    const { themeColor = DEFAULT_COLOR, colorSchemeType, simulationType } = colorOptions || {};
    const advices = chartTypeRecommendations
      ?.map((chartTypeAdvice) => {
        const { chartType } = chartTypeAdvice;
        const chartTypeSpec = getChartTypeSpec({
          chartType,
          data,
          dataProps,
          chartKnowledge: advisor.ckb[chartType],
        });

        // step 3: apply spec processors such as design rules, theme, color, to improve spec
        if (chartTypeSpec && refine) {
          const partEncSpec = applyDesignRules(chartType, dataProps, advisor.ruleBase, chartTypeSpec);
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
