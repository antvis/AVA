import { AsyncSeriesHook, SyncHook, AsyncParallelHook } from 'tapable';

import { AdviseParams, AdvisorPipelineContext } from '../types';
import { DataAnalyzePlugin, SpecGeneratePlugin } from '../advise-pipeline';
import { ChartRecommendPlugin } from '../advise-pipeline/plugins';

import { AdvisorPlugin } from './plugin';
import { DEFAULT_RES_KEY, BasePipeline } from './types';

export class Pipeline extends BasePipeline {
  context?: AdvisorPipelineContext;

  pluginMap!: Map<string, AdvisorPlugin<any, any>>;

  constructor(params: { context: AdvisorPipelineContext; plugins: AdvisorPlugin<any[], any>[] }) {
    super('AVAPipeline');
    this.dataStore = {
      before: new Map(),
      recommend: new Map(),
      generate: new Map(),
    };
    this.stages = {
      before: new SyncHook(['input', 'options']),
      beforeAsync: new AsyncSeriesHook(['input', 'options']),
      recommend: new SyncHook(['input', 'options']),
      recommendAsync: new AsyncParallelHook(['input', 'options']),
      generate: new SyncHook(['input', 'options']),
      generateAsync: new AsyncSeriesHook(['input', 'options']),
    };
    const { context, plugins = [] } = params;
    const allPlugins = [new DataAnalyzePlugin(), new ChartRecommendPlugin(), new SpecGeneratePlugin(), ...plugins];
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

  execute = (params: AdviseParams) => {
    const input1 = params;
    this.stages.before.call(input1, {
      dataStore: this.dataStore.before,
      context: this.context,
    });
    const output1 = this.dataStore.before.get(DEFAULT_RES_KEY) || {};
    const input2 = { ...input1, ...output1 };
    this.stages.recommend.call(input2 as any, {
      dataStore: this.dataStore.recommend,
      context: this.context,
    });
    const output2: Record<string, any> = {};
    this.dataStore.recommend.forEach((value, key) => {
      output2[key] = value;
    });
    const input3 = { ...input2, ...output2 };
    this.stages.generate.call(input3 as any, {
      dataStore: this.dataStore.generate,
      context: this.context,
    });
    const output = this.dataStore.generate.get(DEFAULT_RES_KEY);
    Object.values(this.dataStore)?.forEach((map) => {
      map.clear();
    });
    return output;
  };

  executeAsync = async (params: AdviseParams) => {
    // before stage
    const input1 = params;
    await this.stages.beforeAsync.promise(input1, {
      dataStore: this.dataStore.before,
      context: this.context,
    });
    const output1 = this.dataStore.before.get(DEFAULT_RES_KEY) || {};

    // recommend stage
    const input2 = { ...input1, ...output1 };
    await this.stages.recommendAsync.promise(input2 as any, {
      dataStore: this.dataStore.recommend,
      context: this.context,
    });
    const output2: Record<string, any> = {};
    this.dataStore.recommend.forEach((value, key) => {
      output2[key] = value;
    });

    // generate stage
    const input3 = { ...input2, ...output2 };
    await this.stages.generateAsync.promise(input3 as any, {
      dataStore: this.dataStore.generate,
      context: this.context,
    });
    const output = this.dataStore.generate.get(DEFAULT_RES_KEY);
    Object.values(this.dataStore)?.forEach((map) => {
      map.clear();
    });
    return output;
  };
}
