import type { Purpose } from '@antv/ckb';
import type { SimulationType } from '@antv/smart-color';
import type { ColorSchemeType } from '@antv/color-schema';
import type { Preferences, RuleType } from '../../ruler';

export type Theme = {
  /** hex string */
  primaryColor?: string;
};

/**
 * @public
 */
export interface AdvisorOptions {
  /**
   * analysis purpose, correspond to purpose of CKB, including
   * Comparison
   * Trend
   * Distribution
   * Rank
   * Proportion
   * Composition
   */
  purpose?: Purpose;
  /**
   * preference settings for landscape or portrait
   */
  preferences?: Preferences;
  /**
   * whether to apply design rules
   */
  refine?: boolean;
  /**
   * specify fields in the dataset
   */
  fields?: string[];
  /**
   * whether to show scoring process in console
   * @deprecated since 3.0.0, use `exportLog` instead
   */
  showLog?: boolean;
  /**
   * custom theme
   */
  theme?: Theme;
  /**
   * only consider chart types with spec
   */
  requireSpec?: boolean;
}

/**
 * return type of color options for smart color
 * @public
 */
export interface SmartColorOptions {
  /**
   *  hex string
   */
  themeColor?: string;
  /**
   * mode employed for color generation
   */
  colorSchemeType?: ColorSchemeType;
  /**
   * mode employed for color simulation
   */
  simulationType?: SimulationType;
}

/**
 * Log for scoring a single rule.
 */
export interface ScoringResultForRule {
  phase: 'ADVISE' | 'LINT';
  /**
   * standard ChartRuleId or any string id for custom rule
   */
  ruleId: string;
  /**
   * scoring result for this rule, score = base * weight
   */
  score: number;
  /**
   * scoring from validator
   */
  base: number;
  /**
   * weight of this rule
   */
  weight: number;
  /**
   * type of this rule
   */
  ruleType: RuleType;
}

/**
 * Summary log of checking all rules for a single chart type.
 */
export interface ScoringResultForChartType {
  /**
   * scoring for this chart type: standard ChartId or any string for custom chart
   */
  chartType: string;
  /**
   * final score
   */
  score: number;
  /**
   * whole records of scoring
   */
  log?: ScoringResultForRule[];
}
