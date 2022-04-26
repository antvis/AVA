/**
 * Describe a chart recommandation problem.
 */
export interface Lint {
  /** rule type: hard / soft / design  */
  type: string;
  /** rule id */
  id: string;
  /** rule score */
  score: number;
  /** fix solution */
  fix?: any;
  /** docs: explaination */
  docs?: any;
}
