/**
 * @public
 */
export type RuleType = 'HARD' | 'SOFT';

export interface RuleConfig {
  /**
   * customized weight for the rule
   */
  weight?: number;
  /**
   * whether to ignore the rule
   */
  off?: boolean;
}

export type Docs = {
  lintText?: string;
  detailedText?: string;
  moreLink?: string;
  [key: string]: any;
};

export type RuleModule = HardRuleModule | SoftRuleModule | DesignRuleModule;

type DefaultRuleModule = {
  id: string;
  chartTypes?: string[];
  triggers?: any;
  docs: Docs;
  option?: RuleConfig;
};

// HardRule 用于校验候选项能够通过规则
export type HardRuleModule = DefaultRuleModule & {
  type: 'HARD';
  validator: (dataProps: any, extraInfo?: any) => Boolean;
};

// SoftRule 用于给候选项打分
export type SoftRuleModule = DefaultRuleModule & {
  type: 'SOFT';
  validator: (dataProps: any, extraInfo?: any) => number;
};

// DesignRule 用于推荐配置项的值
// TODO 确认 optimizer 返回一个 {item: ICFG, score: number} 的推荐列表是否合适
export type DesignRuleModule = DefaultRuleModule & {
  type: 'DESIGN';
  optimizer: (dataProps: any, extraInfo?: any) => any;
}
