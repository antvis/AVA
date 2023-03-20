import { ckb } from '../ckb';

import { processRuleCfg } from './ruler';
import { advicesForChart } from './advise-pipeline';
import { checkRules } from './lint-pipeline/check-rules';

import type { ChartKnowledgeBase } from '../ckb';
import type { RuleModule } from './ruler';
import type {
  AdvisorConfig,
  Advice,
  AdviseParams,
  ChartAdviseParams,
  AdviseResult,
  LintResult,
  LintParams,
  Lint,
} from './types';

/*
 * 搬运计划
 * 0. 架构设计
 * 1. Advisor 搬运
 * 2. Linter 搬运
 */

export class Advisor {
  /**
   * CKB used for advising
   */
  ckb: ChartKnowledgeBase;

  /**
   * rule base used for advising
   */
  ruleBase: Record<string, RuleModule>;

  constructor(config: AdvisorConfig = {}) {
    this.ckb = ckb(config.ckbCfg);
    this.ruleBase = processRuleCfg(config.ruleCfg);
  }

  advise(params: AdviseParams): Advice[] {
    const adviseResult = advicesForChart(params as ChartAdviseParams, this.ckb, this.ruleBase);
    return adviseResult.advices;
  }

  adviseWithLog(params: AdviseParams): AdviseResult {
    const adviseResult = advicesForChart(params as ChartAdviseParams, this.ckb, this.ruleBase);
    return adviseResult;
  }

  lint(params: LintParams): Lint[] {
    const lintResult = checkRules(params, this.ruleBase, this.ckb);
    return lintResult.lints;
  }

  lintWithLog(params: LintParams): LintResult {
    const lintResult = checkRules(params, this.ruleBase, this.ckb);
    return lintResult;
  }
}
