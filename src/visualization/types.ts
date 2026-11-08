import type { ChartType } from '../contracts/visualize';

/**
 * GPT-Vis JSON config
 */
export type ChartConfig = { type: string; [key: string]: unknown };

/**
 * Chart type definition — structured metadata for prompt generation
 */
export interface ChartTypeDefinition {
  /** Chart type identifier */
  type: ChartType;
  /** Chinese name */
  name: string;
  /** Feature descriptions */
  features: string[];
  /** Applicable use cases */
  useCases: string[];
  /** Data requirements */
  dataRequirements: string[];
  /** Limitations / inapplicable scenarios */
  limitations: string[];
}
