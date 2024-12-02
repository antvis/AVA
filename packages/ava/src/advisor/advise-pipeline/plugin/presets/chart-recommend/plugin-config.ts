import { pullAt } from 'lodash';
import { AsyncSeriesHook } from 'tapable';

import {
  type AdvisorPipelineContext,
  type ChartRecommendInput,
  type ChartRecommendOutput,
  type AdvisorPluginType,
  PipelineStage,
} from '../../../../types';
import { Plugin } from '../../../../pipeline/plugin';
import { type BasePipeline, PIPELINE_STAGE } from '../../../../pipeline/types';

import { getChartTypeRecommendations } from './get-chart-Type';
import { getEncodeMapping } from './encode/encode-mapping';

const DEFAULT_CHART_RECOMMEND_PLUGIN_NAME = 'defaultChartRecommender';
export const chartRecommendPlugin: AdvisorPluginType<ChartRecommendInput, ChartRecommendOutput> = {
  name: DEFAULT_CHART_RECOMMEND_PLUGIN_NAME,
  stage: PipelineStage.chartRecommend,
  execute(input: ChartRecommendInput, context?: AdvisorPipelineContext): ChartRecommendOutput {
    const { dataProps } = input;
    const { advisor, options, extra } = context || {};
    const preferChartType = options.preferences.chartType;
    const chartConfigs = getChartTypeRecommendations({
      dataProps,
      chartWIKI: advisor.ckb,
      ruleBase: advisor.ruleBase,
      options,
      advisorContext: { extra },
    });

    // 处理有偏好图表的情况，将偏好图表作为最匹配推荐
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

    return { chartConfigs: chartConfigsWithEncode };
  },
};

// 插件类
export class ChartRecommendPlugin extends Plugin<[ChartRecommendInput, any], void> {
  hooks!: {
    after: AsyncSeriesHook<[ChartRecommendOutput, any], ChartRecommendOutput>;
  };

  constructor() {
    super(DEFAULT_CHART_RECOMMEND_PLUGIN_NAME);
    this.hooks = {
      after: new AsyncSeriesHook(),
    };
  }

  apply = (pipeline: BasePipeline) => {
    pipeline.stages.recommend.tapPromise(this.name, this.executeAsync);
  };

  executeAsync = async (input: ChartRecommendInput, pipeline: BasePipeline) => {
    const { dataProps } = input;
    const { advisor, options, extra } = pipeline?.context || {};
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
        pipeline?.context
      );
      return {
        ...chartTypeAdvice,
        encode,
      };
    });

    const result = { chartConfigs: chartConfigsWithEncode };
    await this.hooks.after.promise(result, pipeline?.dataStore);
    pipeline.dataStore.set(PIPELINE_STAGE.STAGE_RECOMMEND, result);
  };
}
