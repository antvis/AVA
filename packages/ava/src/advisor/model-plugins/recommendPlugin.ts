import { AdvisorPlugin } from '../pipeline/plugin';
import { DEFAULT_CHART_RECOMMEND_PLUGIN_NAME } from '../advise-pipeline';

import { MODEL_RECOMMEND_PLUGIN_NAME, MODEL_RESULT_KEY, MODEL_RULE_RESULT_KEY } from './constant';

import type { ModelRecommendPluginOptions, ModelRequestFn, ModelRequestFn2 } from './types';

export class ModelRecommendPlugin extends AdvisorPlugin<any, any> {
  request!: ModelRequestFn;

  request2!: ModelRequestFn2;

  constructor(options: ModelRecommendPluginOptions) {
    super(MODEL_RECOMMEND_PLUGIN_NAME);
    this.request = options?.request;
    this.request2 = options?.request2;
  }

  apply = (pipeline) => {
    const recommendPlugin = pipeline.getPlugin(DEFAULT_CHART_RECOMMEND_PLUGIN_NAME);
    pipeline.stages.recommendAsync.tapPromise(this.name, this.getModelResult);
    if (recommendPlugin) {
      recommendPlugin.hooks.afterAsync.tapPromise(this.name, this.getModelResultWithRule);
    }
  };

  getModelResultWithRule = async (input, config) => {
    const { dataStore } = config;
    try {
      const ruleResult = dataStore.get('DEFAULT');
      const res = await this.request2?.({
        ...input,
        ...ruleResult,
      });
      dataStore.set(MODEL_RULE_RESULT_KEY, res);
    } catch (e) {
      return Promise.resolve();
    }
    return Promise.resolve();
  };

  getModelResult = async (input, config) => {
    const { dataStore } = config;
    try {
      const res = await this.request?.(input);
      dataStore.set(MODEL_RESULT_KEY, res);
    } catch (e) {
      return Promise.resolve();
    }
    return Promise.resolve();
  };
}
