import { ckb } from '../ckb';

import { processRuleCfg } from './ruler';
import { dataToAdvices } from './advise-pipeline';
import { checkRules } from './lint-pipeline/check-rules';
import { Pipeline } from './pipeline/pipeline';
import { HooksPipeline } from './pipeline/hooks-pipeline';
import { Plugin } from './pipeline/plugin';

import type { ChartKnowledgeBase } from '../ckb';
import type { RuleModule } from './ruler';
import type {
  AdvisorConfig,
  Advice,
  AdviseParams,
  AdviseResult,
  LintResult,
  LintParams,
  Lint,
  AdvisorPluginType,
  DataAnalyzeInput,
  SpecGenerateOutput,
} from './types';

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

  hooksPipeline: HooksPipeline;

  constructor(
    config: AdvisorConfig = {},
    custom: {
      plugins?: AdvisorPluginType[];
      hooksPlugins?: Plugin<any[], any>[];
      /** extra info to pass through the pipeline
       * 额外透传到推荐 pipeline 中的业务信息
       */
      extra?: Record<string, any>;
    } = {}
  ) {
    // init
    const { plugins, hooksPlugins, extra = {} } = custom;
    this.ckb = ckb(config.ckbCfg);
    this.ruleBase = processRuleCfg(config.ruleCfg);
    this.pipeline = new Pipeline<DataAnalyzeInput, SpecGenerateOutput>({
      plugins,
      context: { advisor: this, extra },
    });
    this.hooksPipeline = new HooksPipeline({
      plugins: hooksPlugins,
      context: { advisor: this, extra },
    });
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

  async adviseAsync(params: AdviseParams): Promise<Advice[]> {
    const adviseResult = await this.pipeline.execute(params);
    if (params.options?.requireSpec !== false) {
      return adviseResult.advices?.filter((advice) => advice.spec);
    }
    return adviseResult.advices;
  }

  /**
   * 新 pipeline 执行
   * @param params
   * @returns
   */
  adviseAsync2 = async (params: AdviseParams): Promise<any> => {
    const result = await this.hooksPipeline.execute(params);
    return result;
  };

  lint(params: LintParams): Lint[] {
    const lintResult = checkRules(params, this.ruleBase, this.ckb);
    return lintResult.lints;
  }

  lintWithLog(params: LintParams): LintResult {
    const lintResult = checkRules(params, this.ruleBase, this.ckb);
    return lintResult;
  }
}
