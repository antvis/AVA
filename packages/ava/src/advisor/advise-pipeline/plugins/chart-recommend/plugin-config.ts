import { pullAt } from 'lodash';
import { AsyncSeriesHook, SyncHook } from 'tapable';

import { type ChartRecommendInput, type ChartRecommendOutput } from '@advisor/types';
import { AdvisorPlugin } from '@advisor/pipeline/plugin';
import { type BasePipeline, DEFAULT_RES_KEY, ContextOptions } from '@advisor/pipeline/types';

import { getChartTypeRecommendations } from './get-chart-Type';
import { getEncodeMapping } from './encode/encode-mapping';

type ArgType = ContextOptions<Map<string, ChartRecommendOutput>>;

export type HookParams1Type = {
  output: ChartRecommendOutput;
  input: ChartRecommendInput;
};
export const DEFAULT_CHART_RECOMMEND_PLUGIN_NAME = 'defaultChartRecommender';
export class ChartRecommendPlugin extends AdvisorPlugin<[ChartRecommendInput, ArgType], void> {
  static DEFAULT_NAME = DEFAULT_CHART_RECOMMEND_PLUGIN_NAME;

  hooks!: {
    after: SyncHook<[HookParams1Type, ArgType], ChartRecommendOutput>;
    afterAsync: AsyncSeriesHook<[HookParams1Type, ArgType], ChartRecommendOutput>;
  };

  constructor() {
    super(DEFAULT_CHART_RECOMMEND_PLUGIN_NAME);
    this.hooks = {
      after: new SyncHook(['input', 'config']),
      afterAsync: new AsyncSeriesHook(['input', 'config']),
    };
  }

  apply = (pipeline: BasePipeline) => {
    pipeline.stages.recommend.tap(this.name, this.execute);
    pipeline.stages.recommendAsync.tapPromise(this.name, this.executeAsync);
  };

  getScoredResult = (input: ChartRecommendInput, config: ArgType) => {
    const { dataProps } = input;
    const { context } = config;
    const { advisor, options, extra } = context || {};
    const preferChartType = options?.preferences?.chartType;
    const chartConfigs = getChartTypeRecommendations({
      dataProps,
      chartWIKI: advisor.ckb,
      ruleBase: advisor.ruleBase,
      options,
      advisorContext: { extra },
    });

    // 处理有偏好图表的情况，将偏好图表作为最匹配推荐
    if (preferChartType) {
      const preferChartTypeIndex = chartConfigs.findIndex((config) => config.chartType === preferChartType);
      if (preferChartTypeIndex !== -1) {
        const element = pullAt(chartConfigs, preferChartTypeIndex);
        chartConfigs.unshift(element[0]); // 将目标元素添加到数组的第一个位置
      } else {
        chartConfigs.unshift({
          score: 1,
          chartType: preferChartType,
        });
      }
    }

    const chartConfigsWithEncode = chartConfigs.map((chartTypeAdvice) => {
      const encode = getEncodeMapping(
        {
          ...input,
          chartType: chartTypeAdvice.chartType,
        },
        context
      );
      return {
        ...chartTypeAdvice,
        encode,
      };
    });
    const result = { chartConfigs: chartConfigsWithEncode };
    return result;
  };

  execute = (input: ChartRecommendInput, config: ArgType) => {
    const result = this.getScoredResult(input, config);
    const { dataStore } = config;
    dataStore.set(DEFAULT_RES_KEY, result);
    dataStore.set(this.name, result);
    this.hooks.after.call({ output: result, input }, config);
  };

  executeAsync = async (input: ChartRecommendInput, config: ArgType) => {
    const result = this.getScoredResult(input, config);
    const { dataStore } = config;
    dataStore.set(DEFAULT_RES_KEY, result);
    dataStore.set(this.name, result);
    await this.hooks.afterAsync.promise({ output: result, input }, config);
  };
}
