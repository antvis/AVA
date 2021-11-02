import { LevelOfMeasurement as LOM } from '@antv/ckb';
import { AntVSpec } from '@antv/antv-spec';
import { analyzer } from '@antv/data-wizard';

/**
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
  chartSpec: AntVSpec
) => object;

/**
 * @public
 */
export const CHART_RULE_ID = [
  'data-check',
  'data-field-qty',
  'no-redundant-field',
  'purpose-check',
  'series-qty-limit',
  'bar-series-qty',
  'line-field-time-ordinal',
  'landscape-or-portrait',
  'diff-pie-sector',
  'nominal-enum-combinatorial',
  'limit-series',
  'aggregation-single-row',
  'all-can-be-table',
];

/**
 * @public
 */
export type ChartRuleID = typeof CHART_RULE_ID[number];

/**
 * @public
 */
export const CHART_DESIGN_RULE_ID = ['x-axis-line-fading'];

/**
 * @public
 */
export type ChartDesignRuleID = typeof CHART_DESIGN_RULE_ID[number];

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
}

/**
 * @public
 */
export type ChartRuleConfigMap = Record<string, ChartRuleConfig>;

/**
 * @public
 * rule config
 */
export type RuleConfig = {
  include?: string[];
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

/**
 * @public
 */
export type Docs = {
  lintText?: string;
  detailedText?: string;
  moreLink?: string;
  [key: string]: any;
};

export type RuleModule = ChartRuleModule | DesignRuleModule;

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
