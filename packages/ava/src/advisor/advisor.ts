import { ckb } from '../ckb';

import { processRuleCfg } from './ruler';
import { dataToAdvices } from './advise-pipeline';
import { checkRules } from './lint-pipeline/check-rules';
import { BaseComponent } from './pipeline/component';
import { Pipeline } from './pipeline/pipeline';
import { dataProcessorPlugin, specGeneratorPlugin, chartTypeRecommendPlugin } from './advise-pipeline/plugin';

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
  PipelineStageType,
  AdvisorPluginType,
  DataProcessorInput,
  DataProcessorOutput,
  ChartTypeRecommendInput,
  ChartTypeRecommendOutput,
  VisualEncoderInput,
  VisualEncoderOutput,
  SpecGeneratorInput,
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

  dataAnalyzer: BaseComponent<DataProcessorInput, DataProcessorOutput>;

  chartTypeRecommender: BaseComponent<ChartTypeRecommendInput, ChartTypeRecommendOutput>;

  chartEncoder: BaseComponent<VisualEncoderInput, VisualEncoderOutput>;

  specGenerator: BaseComponent<SpecGeneratorInput, SpecGeneratorOutput>;

  context: AdvisorPipelineContext;

  plugins: AdvisorPluginType[];

  pipeline: Pipeline;

  constructor(
    config: AdvisorConfig = {},
    custom: {
      plugins?: AdvisorPluginType[];
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
    this.initDefaultComponents();
    const defaultComponents = [this.dataAnalyzer, this.chartTypeRecommender, this.chartEncoder, this.specGenerator];
    this.plugins = plugins;
    this.pipeline = new Pipeline({ components: components ?? defaultComponents });
  }

  private initDefaultComponents() {
    this.dataAnalyzer = new BaseComponent('data', { plugins: [dataProcessorPlugin], context: this.context });
    this.chartTypeRecommender = new BaseComponent('chartType', {
      plugins: [chartTypeRecommendPlugin],
      context: this.context,
    });
    // this.chartEncoder = new BaseComponent('chartEncode', { plugins: [visualEncoderPlugin], context: this.context });
    this.specGenerator = new BaseComponent('specGenerate', { plugins: [specGeneratorPlugin], context: this.context });
  }

  // todo 暂时还在用旧链路，需要改造到新链路
  advise(params: AdviseParams): Advice[] {
    const adviseResult = dataToAdvices({ adviseParams: params, ckb: this.ckb, ruleBase: this.ruleBase });
    return adviseResult.advices;
  }

  async adviseAsync(params: AdviseParams): Promise<Advice[]> {
    this.context = {
      ...this.context,
      data: params.data,
      options: params.options,
    };
    const adviseResult = await this.pipeline.execute(params);
    return adviseResult.advices;
  }

  adviseWithLog(params: AdviseParams): AdviseResult {
    const adviseResult = dataToAdvices({ adviseParams: params, ckb: this.ckb, ruleBase: this.ruleBase });
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

  registerPlugins(plugins: AdvisorPluginType[]) {
    const stage2Components: Record<PipelineStageType, BaseComponent> = {
      dataAnalyze: this.dataAnalyzer,
      chartTypeRecommend: this.chartTypeRecommender,
      encode: this.chartEncoder,
      specGenerate: this.specGenerator,
    };

    plugins.forEach((plugin) => {
      if (typeof plugin.stage === 'string') {
        const pipelineComponent = stage2Components[plugin.stage];
        pipelineComponent.registerPlugin(plugin);
      }
    });
  }
}
