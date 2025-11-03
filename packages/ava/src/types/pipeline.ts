import { AsyncSeriesHook } from 'tapable';

import { Meta, FieldDataType, PlainLikeDataType, DataShard } from '@ava/types/data';

import { AdvisorConfig, AdviseChartParams, AdviseChart, AdviseText, AdviseTextParams } from './advisor';

export type AdviseParams = AdviseChartParams | AdviseTextParams;

export type AdviseResult<T extends AdviseParams> = T extends AdviseChartParams ? AdviseStageOutput : AdviseText;

export type PluginInput<T extends AdviseParams> = {
  dataStore: DataStore;
  context: AdvisorConfig & T;
  curStage: string;
};

export type SubscribeFunction<T extends AdviseParams = AdviseParams> = AsyncSeriesHook<[PluginInput<T>]>['tapPromise'];
export abstract class AdvisorPlugin<I extends AdviseParams> {
  abstract readonly name: string;

  abstract apply(pipeline: BasePipeline<I>): void;

  abstract execute(args: PluginInput<I>): Promise<void>;
}

export interface Stages<T extends AdviseParams> {
  extract: AsyncSeriesHook<[PluginInput<T>]>;
  advise: AsyncSeriesHook<[PluginInput<T>]>;
  generate: AsyncSeriesHook<[PluginInput<T>]>;
}

export type ExtractStageOutput = {
  data?: FieldDataType;
  dataShards?: Array<DataShard>;
};

export type DataStageOutput = {
  dataShards: Array<DataShard>;
};

export type AdviseStageOutput = {
  adviseCharts: AdviseChart[];
  metas: Meta[];
  data: PlainLikeDataType;
}[];

export type GenerateStageOutput = {};

export type DataStore = {
  extract: ExtractStageOutput;
  advise: AdviseStageOutput;
  generate: GenerateStageOutput;
  [key: string]: any;
};

export abstract class BasePipeline<T extends AdviseParams = AdviseChartParams> {
  abstract config: AdvisorConfig;

  abstract stages: Stages<T>;

  abstract pluginMap: Map<string, AdvisorPlugin<T>>;

  /** output of every stage */
  abstract dataStore: DataStore;

  abstract execute(params: T): Promise<AdviseResult<T>>;
}

export type AdviseChartPluginInput = PluginInput<AdviseChartParams>;

export type AdviseTextPluginInput = PluginInput<AdviseTextParams>;

export type IAdviseChartPipeline = BasePipeline<AdviseChartParams>;

export type IAdviseTextPipeline = BasePipeline<AdviseTextParams>;
