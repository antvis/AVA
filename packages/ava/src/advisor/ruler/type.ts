import type { DataTypes } from '../../data';
import type { CkbTypes } from '../../ckb';
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
  /** LevelOfMeasurement */
  readonly levelOfMeasurements?: CkbTypes.LevelOfMeasurement[];
  /** used for split column xy series */
  readonly rawData: any[];
  /** required types in DataTypes. FieldInfo */
  readonly recommendation: DataTypes.FieldInfo['recommendation'];
  readonly type: DataTypes.FieldInfo['type'];
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
  chartWIKI?: CkbTypes.ChartKnowledgeBase;
  dataProps: BasicDataPropertyForAdvice[] | BasicDataPropertyForAdvice;
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
  dataProps: BasicDataPropertyForAdvice[] | BasicDataPropertyForAdvice,
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
