import type { ScoringResultForRule } from '../advisor';
import type { RuleType } from '../ruler';

/**
 * Describe a chart recommandation problem.
 */
export interface Lint {
  /** rule type: 'HARD' | 'SOFT' | 'DESIGN'  */
  type: RuleType;
  /** rule id: standard ruleId or any string for custom rule */
  id: string;
  /** rule score */
  score: number;
  /** fix solution */
  fix?: any;
  /** docs: explanation */
  docs?: any;
}

export interface LintsWithLog {
  lints: Lint[];
  log: ScoringResultForRule[];
}
