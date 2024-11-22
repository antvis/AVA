import { deepMix } from '../../../../utils';
import { DEFAULT_COLOR } from '../../../constants';
import {
  type AdvisorPipelineContext,
  type SpecGenerateInput,
  type SpecGenerateOutput,
  type AdvisorPluginType,
  type Specification,
  PipelineStage,
  ChartConfig,
} from '../../../../types';

import { applyDesignRules, applySmartColor, applyTheme } from './spec-processors';
import { getChartTypeSpec } from './get-chart-spec';
import { GenerateChartSpecParams } from './types';

type SingChartSpecGenerateParams = GenerateChartSpecParams & { chartType: string };

const refineSpec = (
  params: SingChartSpecGenerateParams & {
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
  input: Omit<SpecGenerateInput, 'chartConfigs'> & ChartConfig,
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

const DEFAULT_SPEC_GENERATE_PLUGIN_NAME = 'defaultSpecGenerator';
export const specGeneratePlugin: AdvisorPluginType<SpecGenerateInput, SpecGenerateOutput> = {
  name: DEFAULT_SPEC_GENERATE_PLUGIN_NAME,
  stage: PipelineStage.specGenerate,
  execute: (input: SpecGenerateInput, context: AdvisorPipelineContext): SpecGenerateOutput => {
    const { chartConfigs } = input || {};
    const advices = chartConfigs?.map((chartTypeAdvice) => {
      const { chartType, encode } = chartTypeAdvice;
      const spec = generateSpecForChartType({ ...input, chartType, encode }, context);
      return {
        ...chartTypeAdvice,
        type: chartType,
        spec,
      };
    });

    return { advices };
  },
};
