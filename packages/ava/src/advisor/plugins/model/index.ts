import { AdvisorPlugin } from '@ava/advisor/advise-pipeline/types';
import { ChartRecommendPlugin } from '@advisor/advise-pipeline/plugins/chart-recommend';
import { DEFAULT_RES_KEY } from '@advisor/advise-pipeline/constants';

import {
  MODEL_RECOMMEND_PLUGIN_NAME,
  MODEL_RESULT_KEY,
  MODEL_RULE_RESULT_KEY,
  PLUGIN_TYPE,
  TYPE_CONST,
  TYPE_RESULT_CONST,
} from './constant';

import type { ModelPluginOptions, ModelRequestFn, GenerateSelectFn } from './types';

const defaultSelect = (payload) => {
  return payload?.DEFAULT;
};

const defaultRequest = () => {
  return null;
};

export class ModelPlugin extends AdvisorPlugin {
  static TYPE = TYPE_CONST;

  static PLUGIN_NAME = MODEL_RECOMMEND_PLUGIN_NAME;

  types!: PLUGIN_TYPE[];

  request!: ModelRequestFn;

  select!: GenerateSelectFn;

  constructor(options: ModelPluginOptions) {
    super(MODEL_RECOMMEND_PLUGIN_NAME);
    // 默认只使用模型推荐
    this.types = options.types || [PLUGIN_TYPE.MODEL];
    this.select = options?.select || defaultSelect;
    this.request = options?.request || defaultRequest;
  }

  apply = (pipeline) => {
    // register recommend hooks
    if (this.types.includes(PLUGIN_TYPE.MODEL)) {
      pipeline.stages.recommendAsync.tapPromise(this.name, this.recommend);
    }

    if (this.types.includes(PLUGIN_TYPE.RULE_MODEL)) {
      const recommendPlugin = pipeline.getPlugin(ChartRecommendPlugin.DEFAULT_NAME);
      if (recommendPlugin) {
        recommendPlugin.hooks.afterAsync.tapPromise(this.name, this.recommendAfterRule);
      }
    }

    // register generate hooks
    pipeline.stages.generateAsync.tapPromise(this.name, this.generate);
  };

  recommend = async (input, config) => {
    const { dataStore } = config;
    const payload = { input, output: undefined };
    try {
      const res = await this.request?.(payload);
      dataStore.set(MODEL_RESULT_KEY, res);
    } catch (e) {
      return Promise.resolve();
    }
    return Promise.resolve();
  };

  recommendAfterRule = async (payload, config) => {
    const { dataStore } = config;
    try {
      const res = await this.request?.(payload);
      dataStore.set(MODEL_RULE_RESULT_KEY, res);
    } catch (e) {
      return Promise.resolve();
    }
    return Promise.resolve();
  };

  generate = async (input, config) => {
    const { dataStore } = config;
    try {
      const result = this.select?.(input, TYPE_RESULT_CONST);
      dataStore.set(DEFAULT_RES_KEY, result);
    } catch (e) {
      dataStore.set(DEFAULT_RES_KEY, dataStore.get(DEFAULT_RES_KEY));
    }
    return Promise.resolve();
  };
}
