import { AsyncSeriesHook, SyncHook, AsyncParallelHook } from 'tapable';

import {
  AdviseParams,
  AdvisorPipelineContext,
  DataAnalyzeInput,
  DataAnalyzeOutput,
  ChartRecommendInput,
  ChartRecommendOutput,
} from '../types';

import { AdvisorPlugin } from './plugin';

export const DEFAULT_RES_KEY = 'DEFAULT';

export type DataStore = Map<string, any>;

export type ContextOptions<T> = {
  dataStore: T;
  context: AdvisorPipelineContext;
};

export class BasePipeline extends AdvisorPlugin<[AdviseParams], any> {
  dataStore!: {
    before: Map<string, DataAnalyzeOutput>;
    recommend: Map<string, ChartRecommendOutput>;
    generate: Map<string, ChartRecommendOutput>;
  };

  context?: AdvisorPipelineContext;

  pluginMap!: Map<string, AdvisorPlugin<any[], any>>;

  stages!: {
    before: SyncHook<[DataAnalyzeInput, ContextOptions<Map<string, DataAnalyzeOutput>>], void>;
    beforeAsync: AsyncSeriesHook<[DataAnalyzeInput, ContextOptions<Map<string, DataAnalyzeOutput>>], void>;
    recommend: SyncHook<[ChartRecommendInput, ContextOptions<Map<string, ChartRecommendOutput>>], void>;
    recommendAsync: AsyncParallelHook<[ChartRecommendInput, ContextOptions<Map<string, ChartRecommendOutput>>], void>;
    generate: SyncHook<[Record<string, ChartRecommendOutput>, ContextOptions<Map<string, ChartRecommendOutput>>], void>;
    generateAsync: AsyncSeriesHook<
      [Record<string, ChartRecommendOutput>, ContextOptions<Map<string, ChartRecommendOutput>>],
      void
    >;
  };

  getPlugin: (name: string) => AdvisorPlugin<any, any> | undefined;

  execute?: (params: AdviseParams) => ChartRecommendOutput;

  executeAsync?: (params: AdviseParams) => Promise<ChartRecommendOutput>;
}
