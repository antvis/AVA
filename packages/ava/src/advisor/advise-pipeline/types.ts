import { AsyncSeriesHook, SyncHook, AsyncParallelHook } from 'tapable';

import {
  AdviseResult,
  AdviseParams,
  AdvisorPipelineContext,
  DataAnalyzeInput,
  DataAnalyzeOutput,
  ChartRecommendInput,
  ChartRecommendOutput,
} from '../types';

export const DEFAULT_RES_KEY = 'DEFAULT';

export type DataStore = Map<string, any>;

export type ContextOptions<T> = {
  dataStore: T;
  context: AdvisorPipelineContext;
};

type AsArray<T> = T extends any[] ? T : [T];

export class AdvisorPlugin<I = any, O = any> {
  name!: string;

  constructor(name: string) {
    this.name = name;
  }

  apply: (pipeline: BasePipeline) => void;

  execute?: (...args: AsArray<I>) => O = () => {
    throw new Error('method should be implement by sub class');
  };

  executeAsync?: (...args: AsArray<I>) => Promise<O> = async () => {
    return Promise.reject(new Error('method should be implement by sub class'));
  };
}

export class BasePipeline extends AdvisorPlugin<[AdviseParams], any> {
  dataStore!: {
    before: Map<string, DataAnalyzeOutput>;
    recommend: Map<string, ChartRecommendOutput>;
    generate: Map<string, AdviseResult>;
  };

  context?: AdvisorPipelineContext;

  pluginMap!: Map<string, AdvisorPlugin<any[], any>>;

  stages!: {
    before: SyncHook<[DataAnalyzeInput, ContextOptions<Map<string, DataAnalyzeOutput>>], void>;
    beforeAsync: AsyncSeriesHook<[DataAnalyzeInput, ContextOptions<Map<string, DataAnalyzeOutput>>], void>;
    recommend: SyncHook<[ChartRecommendInput, ContextOptions<Map<string, ChartRecommendOutput>>], void>;
    recommendAsync: AsyncParallelHook<[ChartRecommendInput, ContextOptions<Map<string, ChartRecommendOutput>>], void>;
    generate: SyncHook<[Record<string, ChartRecommendOutput>, ContextOptions<Map<string, AdviseResult>>], void>;
    generateAsync: AsyncSeriesHook<
      [Record<string, ChartRecommendOutput>, ContextOptions<Map<string, AdviseResult>>],
      void
    >;
  };

  getPlugin: (name: string) => AdvisorPlugin<any, any> | undefined;

  execute?: (params: AdviseParams) => AdviseResult;

  executeAsync?: (params: AdviseParams) => Promise<AdviseResult>;
}
