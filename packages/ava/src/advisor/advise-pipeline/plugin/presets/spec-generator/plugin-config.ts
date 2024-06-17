import { deepMix } from '../../../../utils';
import { DEFAULT_COLOR } from '../../../constants';

import { applyDesignRules, applySmartColor, applyTheme } from './spec-processors';
import { getChartTypeSpec } from './get-chart-spec';

import type {
  AdvisorPipelineContext,
  SpecGeneratorInput,
  SpecGeneratorOutput,
  AdvisorPluginType,
  Specification,
} from '../../../../types';

const refineSpec = (
  params: SpecGeneratorInput & {
    chartType: string;
    spec: Specification;
  },
  context: AdvisorPipelineContext
) => {
  const { chartType, dataProps, spec } = params;
  const { options, advisor } = context;
  const { refine = false, theme, colorOptions, smartColor } = options || {};
  const { themeColor = DEFAULT_COLOR, colorSchemeType, simulationType } = colorOptions || {};
  // apply spec processors such as design rules, theme, color, to improve spec
  if (spec && refine) {
    const partEncSpec = applyDesignRules(chartType, dataProps, advisor.ruleBase, spec, context);
    deepMix(spec, partEncSpec);
  }

  // custom theme
  if (spec) {
    if (theme && !smartColor) {
      const partEncSpec = applyTheme(dataProps, spec, theme);
      deepMix(spec, partEncSpec);
    } else if (smartColor) {
      const partEncSpec = applySmartColor(dataProps, spec, themeColor, colorSchemeType, simulationType);
      deepMix(spec, partEncSpec);
    }
  }
};

const generateSpecForChartType = (
  input: SpecGeneratorInput & {
    chartType: string;
  },
  context: AdvisorPipelineContext
) => {
  const { dataProps, data, chartType, encode } = input;
  const chartKnowledge = context?.advisor?.ckb?.[chartType];
  const spec = getChartTypeSpec({
    chartType,
    data,
    dataProps,
    encode,
    chartKnowledge,
  });

  refineSpec({ ...input, spec, chartType }, context);
  return spec;
};

export const specGeneratorPlugin: AdvisorPluginType<SpecGeneratorInput, SpecGeneratorOutput> = {
  name: 'defaultSpecGenerator',
  stage: ['specGenerate'],
  execute: (input: SpecGeneratorInput, context: AdvisorPipelineContext): SpecGeneratorOutput => {
    const chartTypeRecommendations =
      input.chartTypeRecommendations ??
      (input.chartType
        ? [
            {
              chartType: input.chartType,
              encode: input.encode,
            },
          ]
        : []);
    const advices = chartTypeRecommendations?.map((chartTypeAdvice) => {
      const { chartType, encode } = chartTypeAdvice;
      const spec = generateSpecForChartType({ ...input, chartType, encode }, context);
      return {
        ...chartTypeAdvice,
        spec,
      };
    });

    return { advices };
  },
};
