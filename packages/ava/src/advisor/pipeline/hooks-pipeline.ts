import { AsyncSeriesHook, SyncHook, AsyncParallelHook } from 'tapable';

import { AdviseParams, AdvisorPipelineContext } from '../types';
import { DataAnalyzePlugin, SpecGeneratePlugin } from '../advise-pipeline';
import { ChartRecommendPlugin } from '../advise-pipeline/plugin';

import { Plugin } from './plugin';
import { PIPELINE_STAGE, DataStore, BasePipeline } from './types';

export class HooksPipeline extends BasePipeline {
  dataStore!: DataStore;

  context?: AdvisorPipelineContext;

  pluginMap!: Map<string, Plugin<any[], any>>;

  stages!: {
    // 执行之前的预处理，内置的插件有数据统计特征计算
    before: SyncHook<[AdviseParams, HooksPipeline], any>;
    // 执行推荐，内置插件有基于ckb、rule的规则推荐
    recommend: AsyncParallelHook<[any, HooksPipeline], any>;
    // 生成，内置插件有生成推荐结果以及日志插件（只消费 ckb 的结果）
    generate: AsyncSeriesHook<[any, HooksPipeline], void>;
  };

  constructor(params: { context: AdvisorPipelineContext; plugins: Plugin<any[], any>[] }) {
    super('AVAPipeline');
    this.dataStore = new Map();
    this.stages = {
      before: new SyncHook(['input', 'pipeline']),
      recommend: new AsyncParallelHook(['input', 'pipeline']),
      generate: new AsyncSeriesHook(['input', 'pipeline']),
    };
    const { context, plugins = [] } = params;
    const allPlugins = [
      // 默认内置插件
      new DataAnalyzePlugin(),
      new ChartRecommendPlugin(),
      new SpecGeneratePlugin(),
      ...plugins,
    ];
    this.pluginMap = new Map();
    allPlugins.forEach((plugin) => {
      this.pluginMap.set(plugin.name, plugin);
    });
    this.context = context;
    this.init();
  }

  private init = () => {
    this.pluginMap.forEach((plugin) => {
      plugin.apply(this);
    });
  };

  getPlugin = (name: string) => {
    return this.pluginMap.get(name);
  };

  execute = async (params) => {
    let input = params;
    this.stages.before.call(input, this);
    const output1 = this.dataStore.get(PIPELINE_STAGE.STAGE_BEFORE) || {};
    input = { ...input, ...output1 };
    await this.stages.recommend.promise(input, this);
    const output2 = this.dataStore.get(PIPELINE_STAGE.STAGE_RECOMMEND) || {};
    input = { ...input, ...output2 };
    await this.stages.generate.promise(input, this);
    const output = this.dataStore.get(PIPELINE_STAGE.STAGE_GENERATE) || {};
    this.dataStore.clear();
    return output;
  };
}
