import { Advisor } from '../advisor';
import { Linter } from '../linter';

import type { CKBConfig, AdviseParams } from '../advisor';
import type { BasicDataPropertyForAdvice, RuleConfig } from '../ruler/interface';
import type { Advice } from '../types';

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
  advise(params: AdviseParams): Advice[] {
    const { dataProps, options } = params;
    const advices = this.advisor.advise(params);
    const advicesAfterLint: Advice[] = advices.map((advice) => {
      // No lint suggestions for graph visualization for now
      if (advice.type === 'graph') {
        return { ...advice, lint: [] };
      }

      const lintResult = this.linter.lint({
        spec: advice.spec,
        dataProps: dataProps as BasicDataPropertyForAdvice[],
        options,
      });
      return { ...advice, lint: lintResult };
    });

    return advicesAfterLint;
  }
}
