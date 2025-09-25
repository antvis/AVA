import { AsyncSeriesHook } from 'tapable';

import {
  AdviseChart,
  AdviseChartParams,
  AdvisorConfig,
  AdvisorPlugin,
  BasePipeline,
  DataStore,
  Stages,
  AdviseChartPluginInput,
} from '@advisor/types';

import { AdvisePlugin, DataPlugin, ExtractPlugin, GeneratePlugin } from './plugins';
import { AdviseChartStageEnum } from './constant';

export class AdviseChartPipeline implements BasePipeline<AdviseChartParams> {
  config: AdvisorConfig;

  pluginMap: Map<string, AdvisorPlugin<AdviseChartParams>>;

  stages: Stages<AdviseChartParams>;

  dataStore: DataStore;

  // centralized configuration of event subscription relationships
  private eventSubscription = {
    extract: [AdviseChartStageEnum.ExtractPlugin],
    data: [AdviseChartStageEnum.DataPlugin],
    advise: [AdviseChartStageEnum.AdvisePlugin],
    generate: [AdviseChartStageEnum.GeneratePlugin],
  };

  constructor(params: { config: AdvisorConfig }) {
    this.dataStore = {
      extract: {},
      data: {},
      advise: {},
      generate: {},
    };
    this.stages = {
      extract: new AsyncSeriesHook(['input']),
      data: new AsyncSeriesHook(['input']),
      advise: new AsyncSeriesHook(['input']),
      generate: new AsyncSeriesHook(['input']),
    };
    const allPlugins = [new ExtractPlugin(), new DataPlugin(), new AdvisePlugin(), new GeneratePlugin()];
    this.pluginMap = new Map();
    allPlugins.forEach((plugin) => {
      this.pluginMap.set(plugin.name, plugin);
    });
    this.config = params.config;
    this.init();
  }

  getPlugin = (name: AdviseChartStageEnum) => {
    return this.pluginMap.get(name);
  };

  private init = () => {
    Object.entries(this.eventSubscription).forEach(([stage, pluginNames]) => {
      const curStage = this.stages[stage] as AsyncSeriesHook<AdviseChartPluginInput>;
      pluginNames.forEach((pluginName) => {
        // subscribe event
        this.getPlugin(pluginName).apply(curStage.tapPromise.bind(curStage));
      });
    });
  };

  execute = async (input: AdviseChartParams) => {
    const pluginInput: AdviseChartPluginInput = {
      dataStore: this.dataStore,
      context: {
        ...this.config,
        ...input,
      },
    };
    await this.stages.extract.promise(pluginInput);

    await this.stages.data.promise(pluginInput);

    await this.stages.advise.promise(pluginInput);

    await this.stages.generate.promise(pluginInput);

    return [] as AdviseChart[];
  };
}
