import type { Purpose } from '@antv/ckb';
import type { SimulationType } from '@antv/smart-color';
import type { ColorSchemeType } from '@antv/color-schema';
import type { Preferences } from '../../ruler';

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
   * log on/off
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
