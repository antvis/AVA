import { Advisor } from '../advisor';
import { Linter } from '../linter';

import type { CKBConfig, AdviseParams } from '../advisor';
import type { BasicDataPropertyForAdvice, RuleConfig } from '../ruler/interface';
import type { Advice, AdvicesWithLog } from '../types';

export class ChartAdvisor {
  private advisor: Advisor;

  private linter: Linter;

  ckbCfg: CKBConfig;

  ruleCfg: RuleConfig;

  constructor(config: Partial<Pick<ChartAdvisor, 'ckbCfg' | 'ruleCfg'>> = {}) {
    this.advisor = new Advisor(config);
    this.linter = new Linter(config.ruleCfg);
  }

  advise(params: AdviseParams): Advice[] {
    const result = this.adviseWithLog(params);
    const { advices } = result;
    return advices;
  }

  /**
   * Advising charts by data and providing linting results for each chart
   */
  adviseWithLog(params: AdviseParams): AdvicesWithLog {
    const { dataProps, options } = params;

    // advising

    const adviceResult = this.advisor.adviseWithLog(params);
    const { advices, log } = adviceResult;

    // linting

    const advicesAfterLint: Advice[] = advices.map((advice) => {
      // No lint suggestions for graph visualization for now
      if (advice.type === 'graph') {
        return { ...advice, lint: [] };
      }

      const { lints, log: lintLog } = this.linter.lintWithLog({
        spec: advice.spec,
        dataProps: dataProps as BasicDataPropertyForAdvice[],
        options,
      });

      log.find((l) => l.chartType === advice.type).log.push(...lintLog);

      return { ...advice, lint: lints };
    });

    const result = {
      advices: advicesAfterLint,
      log,
    };

    return result;
  }
}
