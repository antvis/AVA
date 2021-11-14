import { Purpose } from '@antv/ckb';
import { AntVSpec } from '@antv/antv-spec';
import { SimulationType } from '@antv/smart-color';
import { ColorSchemeType } from '@antv/color-schema';
import { Preferences } from '../../ruler';

export type DataRow = Record<string, any>;
export type DataRows = DataRow[];

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
}

/**
 * @public
 */
export type Specification = AntVSpec;

/**
 * return type of data props to spec
 * @public
 */
export interface Advice {
  type: string;
  /**
   * for the recommended chart, the specification information needs to be declared,
   * which may be antv-spec or custom spec (for indicator cards and cross tabs)
   */
  spec: Specification | null;
  score: number;
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
