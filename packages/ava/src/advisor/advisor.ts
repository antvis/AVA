import { forEach } from 'lodash';

import { ckb } from '../ckb';

import { processRuleCfg } from './ruler';
import { dataToAdvices } from './advise-pipeline';
import { checkRules } from './lint-pipeline/check-rules';
import { BaseComponent, Pipeline } from './pipeline';

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
  AdvisorPipelineContext,
  AdvisorPluginType,
  DataProcessorInput,
  SpecGeneratorOutput,
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

  context: AdvisorPipelineContext;

  plugins: AdvisorPluginType[] = [];

  pipeline: Pipeline;

  constructor(
    config: AdvisorConfig = {},
    custom: {
      plugins?: (AdvisorPluginType & { componentName: string })[];
      components?: BaseComponent[];
      /** extra info to pass through the pipeline
       * 额外透传到推荐 pipeline 中的业务信息
       */
      extra?: Record<string, any>;
    } = {}
  ) {
    // init
    const { plugins, components, extra = {} } = custom;
    this.ckb = ckb(config.ckbCfg);
    this.ruleBase = processRuleCfg(config.ruleCfg);
    this.context = { advisor: this, extra };
    this.pipeline = new Pipeline<DataProcessorInput, SpecGeneratorOutput>({
      components,
      context: this.context,
    });
    this.registerPlugins(plugins);
  }

  // todo 暂时还在用旧链路
  advise(params: AdviseParams): Advice[] {
    const adviseResult = dataToAdvices({ adviseParams: params, ckb: this.ckb, ruleBase: this.ruleBase });
    return adviseResult.advices;
  }

  adviseWithLog(params: AdviseParams): AdviseResult {
    const adviseResult = dataToAdvices({ adviseParams: params, ckb: this.ckb, ruleBase: this.ruleBase });
    return adviseResult;
  }

  // todo 补充 adviseAsyncWithLog?
  async adviseAsync(params: AdviseParams): Promise<Advice[]> {
    this.context = {
      ...this.context,
      options: params.options,
    };
    const adviseResult = await this.pipeline.execute(params);
    return adviseResult.advices;
  }

  lint(params: LintParams): Lint[] {
    const lintResult = checkRules(params, this.ruleBase, this.ckb);
    return lintResult.lints;
  }

  lintWithLog(params: LintParams): LintResult {
    const lintResult = checkRules(params, this.ruleBase, this.ckb);
    return lintResult;
  }

  registerPlugins(plugins: (AdvisorPluginType & { componentName: string })[] = []) {
    forEach(plugins, (plugin) => {
      this.plugins.push(plugin);
      const pipelineComponent = this.pipeline.components.find((component) => component.name === plugin.componentName);
      pipelineComponent.registerPlugin(plugin);
    });
  }
}
