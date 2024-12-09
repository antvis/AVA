import { AdvisorPlugin } from '@advisor/pipeline/plugin';
import { ChartRecommendPlugin } from '@advisor/advise-pipeline/plugins/chart-recommend';

import { MODEL_RECOMMEND_PLUGIN_NAME, MODEL_RESULT_KEY, MODEL_RULE_RESULT_KEY, PLUGIN_TYPE } from './constant';

import type { ModelRecommendPluginOptions, ModelRequestFn } from './types';

export class ModelRecommendPlugin extends AdvisorPlugin<any, any> {
  static TYPE = {
    MODEL: PLUGIN_TYPE.MODEL,
    RULE_MODEL: PLUGIN_TYPE.RULE_MODEL,
  };

  static DEFAULT_NAME = MODEL_RECOMMEND_PLUGIN_NAME;

  request!: ModelRequestFn;

  type!: PLUGIN_TYPE;

  constructor(options: ModelRecommendPluginOptions) {
    super(options?.name || MODEL_RECOMMEND_PLUGIN_NAME);
    // 默认只使用模型推荐
    this.type = options.type || PLUGIN_TYPE.MODEL;
    this.request = options?.request;
  }

  apply = (pipeline) => {
    if (this.type === PLUGIN_TYPE.MODEL) {
      pipeline.stages.recommendAsync.tapPromise(this.name, this.getModelResult);
    } else {
      const recommendPlugin = pipeline.getPlugin(ChartRecommendPlugin.DEFAULT_NAME);
      if (recommendPlugin) {
        recommendPlugin.hooks.afterAsync.tapPromise(this.name, this.getModelResult);
      }
    }
  };

  getModelResult = async (payload, config) => {
    const { dataStore } = config;
    try {
      const res = await this.request?.(payload);
      const key = this.type === PLUGIN_TYPE.MODEL ? MODEL_RESULT_KEY : MODEL_RULE_RESULT_KEY;
      dataStore.set(key, res);
    } catch (e) {
      return Promise.resolve();
    }
    return Promise.resolve();
  };
}
