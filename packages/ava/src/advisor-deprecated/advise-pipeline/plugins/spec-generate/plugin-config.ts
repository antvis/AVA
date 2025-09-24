import { AsyncSeriesHook, SyncHook } from 'tapable';

import { type BasePipeline, ContextOptions, AdvisorPlugin } from '@advisor-deprecated/advise-pipeline/types';
import { deepMix } from '@advisor-deprecated/utils';
import { DEFAULT_COLOR, DEFAULT_RES_KEY } from '@advisor-deprecated/advise-pipeline/constants';

import { applyDesignRules, applySmartColor, applyTheme } from './spec-processors';
import { getChartTypeSpec } from './get-chart-spec';
import { GenerateChartSpecParams } from './types';

import type {
  ChartRecommendOutput,
  AdvisorPipelineContext,
  AdviseResult,
  Specification,
  SpecGenerateInput,
  ChartConfig,
  ChartRecommendationResult,
} from '@advisor-deprecated/types';

type SingChartSpecGenerateParams = GenerateChartSpecParams & { chartType: string };
type ArgType = ContextOptions<Map<string, ChartRecommendOutput>>;

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

export const DEFAULT_SPEC_GENERATE_PLUGIN_NAME = 'defaultSpecGenerator';
export class SpecGeneratePlugin extends AdvisorPlugin<[Record<string, ChartRecommendOutput | any>, ArgType], void> {
  static DEFAULT_NAME = DEFAULT_SPEC_GENERATE_PLUGIN_NAME;

  hooks!: {
    after: SyncHook<[AdviseResult, ArgType]>;
    afterAsync: AsyncSeriesHook<[AdviseResult, ArgType]>;
  };

  constructor() {
    super(DEFAULT_SPEC_GENERATE_PLUGIN_NAME);
    this.hooks = {
      after: new SyncHook(['input', 'config']),
      afterAsync: new AsyncSeriesHook(['input', 'config']),
    };
  }

  generateSpec = (payload: {
    input: { data: any[]; dataProps: any[] };
    chartConfigs: ChartRecommendationResult[];
    context: AdvisorPipelineContext;
  }) => {
    const { chartConfigs, context, input } = payload;
    const advices = chartConfigs?.map((chartTypeAdvice) => {
      const { chartType, encode } = chartTypeAdvice;
      const spec = generateSpecForChartType({ ...input, chartType, encode }, context);
      return {
        ...chartTypeAdvice,
        type: chartType,
        spec,
      };
    });
    return advices;
  };

  execute = (input: Record<string, ChartRecommendOutput | any>, config) => {
    const { dataStore } = config;
    const chartConfigs = input[DEFAULT_RES_KEY]?.chartConfigs;
    const advices = this.generateSpec({
      chartConfigs,
      context: config.context,
      input: { data: input?.data, dataProps: input?.dataProps },
    });
    dataStore.set(DEFAULT_RES_KEY, { advices });
    this.hooks.after.call({ advices }, config);
  };

  executeAsync = async (input: Record<string, ChartRecommendOutput | any>, config) => {
    const { dataStore } = config;
    const chartConfigs = input[DEFAULT_RES_KEY]?.chartConfigs;
    const advices = this.generateSpec({
      chartConfigs,
      context: config.context,
      input: { data: input?.data, dataProps: input?.dataProps },
    });
    dataStore.set(DEFAULT_RES_KEY, { advices });
    await this.hooks.afterAsync.promise({ advices }, config);
  };

  apply = (pipeline: BasePipeline) => {
    pipeline.stages.generate.tap(this.name, this.execute);
    pipeline.stages.generateAsync.tapPromise(this.name, this.executeAsync);
  };
}
