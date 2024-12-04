import { AdvisorPlugin } from '../pipeline/plugin';

import {
  MODEL_GNERATE_PLUGIN_NAME,
  MODEL_RESULT_KEY,
  MODEL_RULE_RESULT_KEY,
  MODEL_GNERATE_RESULT_KEY,
} from './constant';

import type { ModelGeneratePluginOptions, GenerateSelectFn } from './types';

export class ModelGeneratePlugin extends AdvisorPlugin<any, any> {
  static MODEL_RULE_RESULT_KEY = MODEL_RULE_RESULT_KEY;

  static MODEL_RESULT_KEY = MODEL_RESULT_KEY;

  select!: GenerateSelectFn;

  constructor(options: ModelGeneratePluginOptions) {
    super(MODEL_GNERATE_PLUGIN_NAME);
    this.select = options?.select;
  }

  apply = (pipeline) => {
    pipeline.stages.generateAsync.tapPromise(this.name, this.executeAsync);
  };

  executeAsync = (input, config) => {
    const { dataStore } = config;
    try {
      // 纯模型推荐结果
      const modelResult = input?.[MODEL_RESULT_KEY];
      // 在规则的基础上，构建 prompt 用模型推荐的结果
      const modelRuleResult = input?.[MODEL_RULE_RESULT_KEY];
      // 规则推荐结果
      const ruleResult = input?.DEFAULT;

      const result = this.select?.({
        [MODEL_RESULT_KEY]: modelResult,
        [MODEL_RULE_RESULT_KEY]: modelRuleResult,
        DEFAULT: ruleResult,
      });
      dataStore.set(MODEL_GNERATE_RESULT_KEY, result);
      dataStore.set('DEFAULT', result);
    } catch (e) {
      dataStore.set('DEFAULT', dataStore.get('DEFAULT'));
    }
    return Promise.resolve();
  };
}
