import { AsyncSeriesHook, SyncHook } from 'tapable';

import { type ChartRecommendOutput } from '../../../../types';
import { AdvisorPlugin } from '../../../../pipeline/plugin';
import { type BasePipeline, DEFAULT_RES_KEY, ContextOptions } from '../../../../pipeline/types';

type ArgType = ContextOptions<Map<string, ChartRecommendOutput>>;

export const DEFAULT_SPEC_GENERATE_PLUGIN_NAME = 'defaultSpecGenerator';
export class SpecGeneratePlugin extends AdvisorPlugin<[Record<string, ChartRecommendOutput>, ArgType], void> {
  hooks!: {
    after: SyncHook<[ChartRecommendOutput, ArgType]>;
    afterAsync: AsyncSeriesHook<[ChartRecommendOutput, ArgType]>;
  };

  constructor() {
    super(DEFAULT_SPEC_GENERATE_PLUGIN_NAME);
    this.hooks = {
      after: new SyncHook(['input', 'config']),
      afterAsync: new AsyncSeriesHook(['input', 'config']),
    };
  }

  execute = (input: Record<string, ChartRecommendOutput>, config) => {
    const { dataStore } = config;
    const defaultOutput = input[DEFAULT_RES_KEY];
    dataStore.set(DEFAULT_RES_KEY, defaultOutput);
    this.hooks.after.call(defaultOutput, config);
  };

  executeAsync = async (input: Record<string, ChartRecommendOutput>, config) => {
    const { dataStore } = config;
    const defaultOutput = input[DEFAULT_RES_KEY];
    dataStore.set(DEFAULT_RES_KEY, defaultOutput);
    await this.hooks.afterAsync.promise(defaultOutput, config);
  };

  apply = (pipeline: BasePipeline) => {
    pipeline.stages.generate.tap(this.name, this.execute);
    pipeline.stages.generateAsync.tapPromise(this.name, this.executeAsync);
  };
}
