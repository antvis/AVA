export const MODEL_GNERATE_PLUGIN_NAME = 'ModelGeneratePlugin';
export const MODEL_RECOMMEND_PLUGIN_NAME = 'ModelRecommendPlugin';
export const MODEL_RESULT_KEY = 'ModelRecommendPluginModelResult';
export const MODEL_RULE_RESULT_KEY = 'ModelRecommendPluginModelRuleResult';
export const MODEL_GNERATE_RESULT_KEY = 'ModelGeneratePluginResult';
export enum PLUGIN_TYPE {
  MODEL = 'MODEL',
  RULE_MODEL = 'RULE_MODEL',
}

export const TYPE_CONST = {
  MODEL: PLUGIN_TYPE.MODEL,
  RULE_MODEL: PLUGIN_TYPE.RULE_MODEL,
};

export const TYPE_RESULT_CONST = {
  MODEL: MODEL_RESULT_KEY,
  RULE_MODEL: MODEL_RULE_RESULT_KEY,
};
