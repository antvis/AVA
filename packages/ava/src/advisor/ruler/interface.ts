/**
 * TODO
 * 升级DW
 */
// eslint-disable-next-line import/no-unresolved
import { analyzer } from '../../../../data';

import type { LevelOfMeasurement as LOM } from '../../ckb/types';
import type { Specification } from '../../common/types';

/**
 * Type of different rules.
 *
 * @public
 */
export type RuleType = 'HARD' | 'SOFT' | 'DESIGN';

/**
 * this minimum subset of pipeline/DataProperty, make pipeline can start with step2(dataPropsToAdvice)
 * @public
 */
export interface BasicDataPropertyForAdvice {
  /** field name */
  readonly name?: string;
  /** LOM */
  readonly levelOfMeasurements?: LOM[];
  /** used for split column xy series */
  readonly rawData: any[];
  /** required types in analyzer FieldInfo */
  readonly recommendation: analyzer.FieldInfo['recommendation'];
  readonly type: analyzer.FieldInfo['type'];
  readonly distinct?: number;
  readonly count?: number;
  readonly sum?: number;
  readonly maximum?: any;
  readonly minimum?: any;
  readonly missing?: number;
  // for customized props
  [key: string]: any;
}

/**
 * 偏好选项
 * @public
 */
export interface Preferences {
  canvasLayout: 'landscape' | 'portrait';
}

/**
 * @public
 */
export interface Info {
  chartType?: string;
  dataProps: BasicDataPropertyForAdvice[] | BasicDataPropertyForAdvice | Partial<analyzer.GraphProps>;
  purpose?: string;
  preferences?: Preferences;
  customWeight?: number;
  [key: string]: any;
}

/**
 * @public
 */
export type Validator = (args: Info) => number | boolean;
export type Trigger = (args: Info) => boolean;

export type Optimizer = (
  dataProps: BasicDataPropertyForAdvice[] | BasicDataPropertyForAdvice | Partial<analyzer.GraphProps>,
  chartSpec: Specification
) => object;

/**
 * @public
 */
export interface ChartRuleConfig {
  /**
   * customized weight for the rule
   */
  weight?: number;
  /**
   * whether to ignore the rule
   */
  off?: boolean;
  /**
   * user customized parameters of Validator
   */
  extra?: Record<string, any>;
}

/**
 * @public
 */
export type ChartRuleConfigMap = Record<string, ChartRuleConfig>;

/**
 * @public
 */
export type Docs = {
  lintText?: string;
  detailedText?: string;
  moreLink?: string;
  [key: string]: any;
};

type DefaultRuleModule = {
  id: string;
  docs: Docs;
  trigger: Trigger;
  option?: ChartRuleConfig;
};

export type ChartRuleModule = DefaultRuleModule & {
  type: 'HARD' | 'SOFT';
  validator: Validator;
};

export type DesignRuleModule = DefaultRuleModule & {
  type: 'DESIGN';
  optimizer: Optimizer;
};

export type RuleModule = ChartRuleModule | DesignRuleModule;

/**
 * rule config
 *
 * @public
 */
export type RuleConfig = {
  /**
   * include: should contain standard ChartRuleID, or any string id for custom rule.
   */
  include?: string[];
  /**
   * exclude: should contain standard ChartRuleID, or any string id for custom rule.
   */
  exclude?: string[];
  /**
   * customized rule instance
   */
  custom?: Record<string, RuleModule>;
  /**
   * config for rules
   */
  options?: ChartRuleConfigMap;
};
