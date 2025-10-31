import { AsyncSeriesHook } from 'tapable';

import { Meta, FieldDataType, PlainDataType } from '@ava/types/data';

import { AdvisorConfig, AdviseChartParams, AdviseChart, AdviseText, AdviseTextParams } from './advisor';

import type { PURPOSE } from '@ava/constants';
import type { DATA_SHAPE } from '@ava/data';

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
  data: AsyncSeriesHook<[PluginInput<T>]>;
  advise: AsyncSeriesHook<[PluginInput<T>]>;
  generate: AsyncSeriesHook<[PluginInput<T>]>;
}

export type PurposeObject = {
  name: string;
  key: string;
  purpose: PURPOSE;
  purposeDesc?: string;
};

export type DataShard = {
  shape: DATA_SHAPE;
  data: FieldDataType<DATA_SHAPE>;
  metas: Array<any>;
  purpose?: PurposeObject;
};

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
  data: PlainDataType;
}[];

export type GenerateStageOutput = {};

export type DataStore = {
  extract: ExtractStageOutput;
  data: DataStageOutput;
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
