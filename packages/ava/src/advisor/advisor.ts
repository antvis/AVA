import { ckb } from '../ckb';

import { processRuleCfg } from './ruler';
import { dataToAdvices } from './advise-pipeline';
import { checkRules } from './lint-pipeline/check-rules';
import { Pipeline } from './pipeline/pipeline';
import { AdvisorPlugin } from './pipeline/plugin';

import type { ChartKnowledgeBase } from '../ckb';
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

  // 目前暂保留旧链路，还未改造到新链路
  advise(params: AdviseParams): Advice[] {
    const adviseResult = dataToAdvices({ adviseParams: params, ckb: this.ckb, ruleBase: this.ruleBase });
    return adviseResult.advices;
  }

  adviseWithLog(params: AdviseParams): AdviseResult {
    const adviseResult = dataToAdvices({ adviseParams: params, ckb: this.ckb, ruleBase: this.ruleBase });
    return adviseResult;
  }

  adviseSync(params: AdviseParams): Advice[] {
    const adviseResult = this.pipeline.execute(params);
    const advices = adviseResult.chartConfigs
      .map((v) => {
        return {
          type: v.chartType,
          score: v.score,
          log: v.log,
          encode: v.encode,
          spec: null,
        };
      })
      .sort((a, b) => (a.score < b.score ? 1 : -1));
    return advices;
  }

  async adviseAsync(params: AdviseParams): Promise<Advice[]> {
    const adviseResult = await this.pipeline.executeAsync(params);
    const advices = adviseResult.chartConfigs
      .map((v) => {
        return {
          type: v.chartType,
          score: v.score,
          log: v.log,
          spec: null,
          encode: v.encode,
        };
      })
      .sort((a, b) => (a.score < b.score ? 1 : -1));
    return advices;
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
