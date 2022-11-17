import { ckb } from '../ckb';

import { processRuleCfg } from './ruler';
import { advicesForChart } from './advise-pipeline';
import { checkRules } from './lint-pipeline/check-rules';

import type { ChartKnowledgeBase } from '../ckb/types';
import type { RuleModule } from './ruler';
import type {
  AdvisorConfig,
  Advice,
  AdviseParams,
  ChartAdviseParams,
  AdviseResult,
  LintResult,
  LintParams,
  ScoringResultForChartType,
  ScoringResultForRule,
  Lint,
} from './types';

type AdviseLog = ScoringResultForChartType[];
type LintLog = ScoringResultForRule[];

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

  adviseResult: AdviseResult;

  lintResult: LintResult;

  constructor(config: AdvisorConfig = {}) {
    this.ckb = ckb(config.ckbCfg);
    this.ruleBase = processRuleCfg(config.ruleCfg);
  }

  advise(params: AdviseParams): Advice[] {
    this.adviseResult = advicesForChart(params as ChartAdviseParams, true, this.ckb, this.ruleBase);
    return this.adviseResult.advices;
  }

  getAdviseLog(): AdviseLog {
    return this.adviseResult.log;
  }

  lint(params: LintParams): Lint[] {
    this.lintResult = checkRules(params, this.ruleBase, this.ckb);
    return this.lintResult.lints;
  }

  getLintLog(): LintLog {
    return this.lintResult.log;
  }
}
