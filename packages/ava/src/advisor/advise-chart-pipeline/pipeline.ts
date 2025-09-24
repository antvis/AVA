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

export class AdviseChartPipeline implements BasePipeline<AdviseChartParams> {
  config: AdvisorConfig;

  pluginMap: Map<string, AdvisorPlugin<AdviseChartParams>>;

  stages: Stages<AdviseChartParams>;

  dataStore: DataStore;

  constructor(params: { config: AdvisorConfig }) {
    this.dataStore = {
      extract: new Map(),
      data: new Map(),
      advise: new Map(),
      generate: new Map(),
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

  private init = () => {
    this.pluginMap.forEach((plugin) => {
      plugin.apply(this);
    });
  };

  getPlugin = (name: string) => {
    return this.pluginMap.get(name);
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
