import { BasicDataPropertyForAdvice, RuleConfig } from '../ruler/concepts/rule';
import { Advisor, CKBConfig, AdviseParams, ChartAdviseParams } from '../advisor';
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
    const advices = this.advisor.advise({ data, dataProps, fields, options } as ChartAdviseParams);
    const advicesAfterLint = advices.map((advice) => {
      if (advice.type !== 'graph') {
        const lintResult = this.linter.lint({
          spec: advice.spec,
          dataProps: dataProps as BasicDataPropertyForAdvice[],
          options,
        });
        return { ...advice, lint: lintResult };
      } // No lint suggestions for graph visualization for now
      return { ...advice, lint: {} };
    });
    return advicesAfterLint;
  }
}
