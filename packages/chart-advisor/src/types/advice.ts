import type { Specification } from './spec';
import type { Lint } from './lint';

/**
 * Single chart-recommandation from advisor.
 *
 * @public
 */
export interface Advice {
  /**
   * Chart Type: should be standard CKB ChartID or any string id for customized chart.
   */
  type: string;
  /**
   * for the recommended chart, the specification information needs to be declared,
   * which may be antv-spec or custom spec (for indicator cards and cross tabs)
   */
  spec: Specification | null;
  /**
   * A score summarised by rule scoring, which measures how well an individual chart
   * is recommended in a recommendation scenario.
   * The higher the score, the more recommended it is
   */
  score: number;
  /**
   * lint array: problems that remain after the recommendation, with possible solutions accordingly.
   */
  lint?: Lint[];
}
