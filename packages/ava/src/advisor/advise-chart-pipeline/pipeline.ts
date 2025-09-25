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
import { AdviseChartPluginEnum, AdviseChartStageEnum } from './constant';

export class AdviseChartPipeline implements BasePipeline<AdviseChartParams> {
  config: AdvisorConfig;

  pluginMap: Map<string, AdvisorPlugin<AdviseChartParams>>;

  stages: Stages<AdviseChartParams>;

  dataStore: DataStore;

  // centralized configuration of event subscription relationships
  private eventSubscription = {
    [AdviseChartStageEnum.Extract]: [AdviseChartPluginEnum.ExtractPlugin],
    [AdviseChartStageEnum.Data]: [AdviseChartPluginEnum.DataPlugin],
    [AdviseChartStageEnum.Advise]: [AdviseChartPluginEnum.AdvisePlugin],
    [AdviseChartStageEnum.Generate]: [AdviseChartPluginEnum.GeneratePlugin],
  };

  constructor(params: { config: AdvisorConfig }) {
    this.dataStore = {
      [AdviseChartStageEnum.Extract]: {},
      [AdviseChartStageEnum.Data]: {},
      [AdviseChartStageEnum.Advise]: {},
      [AdviseChartStageEnum.Generate]: {},
    };
    this.stages = {
      [AdviseChartStageEnum.Extract]: new AsyncSeriesHook(['input']),
      [AdviseChartStageEnum.Data]: new AsyncSeriesHook(['input']),
      [AdviseChartStageEnum.Advise]: new AsyncSeriesHook(['input']),
      [AdviseChartStageEnum.Generate]: new AsyncSeriesHook(['input']),
    };
    const allPlugins = [new ExtractPlugin(), new DataPlugin(), new AdvisePlugin(), new GeneratePlugin()];
    this.pluginMap = new Map();
    allPlugins.forEach((plugin) => {
      this.pluginMap.set(plugin.name, plugin);
    });
    this.config = params.config;
    this.init();
  }

  getPlugin = (name: AdviseChartPluginEnum) => {
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
      curStage: '',
    };
    await this.stages.extract.promise({ ...pluginInput, curStage: AdviseChartStageEnum.Extract });

    await this.stages.data.promise({ ...pluginInput, curStage: AdviseChartStageEnum.Data });

    await this.stages.advise.promise({ ...pluginInput, curStage: AdviseChartStageEnum.Extract });

    await this.stages.generate.promise({ ...pluginInput, curStage: AdviseChartStageEnum.Generate });

    return [] as AdviseChart[];
  };
}
