import { RuleConfig } from '../ruler/concepts/rule';
import { Advisor, CKBConfig, AdviseParams } from '../advisor';
import { Linter } from '../linter';

export class ChartAdvisor {
  private advisor: Advisor;

  private linter: Linter;

  ckbCfg: CKBConfig;

  ruleCfg: RuleConfig;

  constructor(config: Partial<Pick<ChartAdvisor, 'ckbCfg' | 'ruleCfg'>> = {}) {
    this.advisor = new Advisor(config);
    this.linter = new Linter(config.ruleCfg);
  }

  /**
   * Advising charts by data and providing linting results for each chart
   */
  advise(params: AdviseParams) {
    const { data, dataProps, fields, options } = params;
    const advices = this.advisor.advise({ data, dataProps, fields, options });
    const advicesAfterLint = advices.map((advice) => {
      const lintResult = this.linter.lint({ spec: advice.spec, dataProps, options });
      return { ...advice, lint: lintResult };
    });
    return advicesAfterLint;
  }
}
