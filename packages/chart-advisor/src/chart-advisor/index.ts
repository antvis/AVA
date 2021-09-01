import { RuleConfig } from '../ruler/concepts/rule';
import { Advisor, CKBConfig, AdvisorOptions } from '../advisor';
import { Linter } from '../linter';

export class ChartAdvisor {
  /**
   * @private Advisor instance
   */
  private advisor: Advisor;

  /**
   * @private Linter instance
   */
  private linter: Linter;

  constructor(ckbCfg?: CKBConfig, ruleCfg?: RuleConfig) {
    this.advisor = new Advisor(ckbCfg, ruleCfg);
    this.linter = new Linter(ruleCfg);
  }

  /**
   * Advising charts by data and providing linting results for each chart
   * @param data
   * @param fields
   * @param options
   * @returns
   */
  advise(data: Record<string, any>[], fields?: string[], options?: AdvisorOptions) {
    const advices = this.advisor.advise(data, fields, options);
    const advicesAfterLint = advices.map(advice => {
      const lintResult = this.linter.lint(advice.spec, options);
      return { ...advice, lint: lintResult};
    });

    return advicesAfterLint;
  }


}
