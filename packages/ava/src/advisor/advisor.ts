import { ckb } from '@ava/ckb';

import { processRuleCfg } from './ruler';
import { checkRules } from './lint-pipeline/check-rules';
import { Pipeline } from './pipeline/pipeline';
import { AdvisorPlugin } from './pipeline/plugin';

import type { ChartKnowledgeBase } from '@ava/ckb';
import type { RuleModule } from './ruler';
import type { AdvisorConfig, Advice, AdviseParams, AdviseResult, LintResult, LintParams, Lint } from './types';

export class Advisor {
  /**
   * CKB used for advising
   */
  ckb: ChartKnowledgeBase;

  /**
   * rule base used for advising
   */
  ruleBase: Record<string, RuleModule>;

  pipeline: Pipeline;

  constructor(
    config: AdvisorConfig = {},
    custom: {
      plugins?: AdvisorPlugin<any[], any>[];
      extra?: Record<string, any>;
    } = {}
  ) {
    const { plugins = [], extra = {} } = custom;
    this.ckb = ckb(config.ckbCfg);
    this.ruleBase = processRuleCfg(config.ruleCfg);
    this.pipeline = new Pipeline({ plugins, context: { advisor: this, extra } });
  }

  advise(params: AdviseParams): Advice[] {
    const adviseResult = this.pipeline.execute(params);
    return adviseResult.advices;
  }

  adviseWithLog(params: AdviseParams): AdviseResult {
    const adviseResult = this.pipeline.execute(params);
    return adviseResult;
  }

  async adviseAsync(params: AdviseParams): Promise<Advice[]> {
    const adviseResult = await this.pipeline.executeAsync(params);
    return adviseResult.advices;
  }

  async adviseAsyncWithLog(params: AdviseParams): Promise<AdviseResult> {
    const adviseResult = await this.pipeline.executeAsync(params);
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
