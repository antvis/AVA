import { analyzer } from '@antv/data-wizard';
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

export type HardRuleModule = DefaultRuleModule & {
  type: 'HARD';
  validator: (dataProps: any, extraInfo?: any) => Boolean;
};

export type SoftRuleModule = DefaultRuleModule & {
  type: 'SOFT';
  validator: (dataProps: any, extraInfo?: any) => number;
};

export type DesignRuleModule = DefaultRuleModule & {
  type: 'DESIGN';
  optimizer: (dataProps: any, extraInfo?: any) => any;
};

export interface ExtendFieldInfo extends analyzer.FieldInfo {
  fieldName: string;
  [key: string]: any;
}
