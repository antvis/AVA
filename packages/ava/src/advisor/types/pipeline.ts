import { AsyncSeriesHook } from 'tapable';

import { AdvisorConfig, AdviseChartParams, AdviseChart, AdviseText, AdviseTextParams } from './advisor';

export type AdviseParams = AdviseChartParams | AdviseTextParams;

export type AdviseResult<T extends AdviseParams> = T extends AdviseChartParams ? AdviseChart[] : AdviseText;

export type PluginInput<T extends AdviseParams> = {
  dataStore: DataStore;
  context: AdvisorConfig & T;
};

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

export type DataStore = {
  extract: Map<string, unknown>;
  data: Map<string, unknown>;
  advise: Map<string, unknown>;
  generate: Map<string, unknown>;
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
